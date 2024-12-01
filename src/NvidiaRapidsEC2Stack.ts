/* eslint no-new:0 */
import { Stack, StackProps } from 'aws-cdk-lib'
import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as iam from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'

function makeConnectScript (keyId: string, publicIp: string): string {
  return `#!/usr/bin/env bash
set -eu

if [ ! -f "${keyId}.pem" ]; then
  CONTENT=$(env-cmd --silent aws ssm get-parameter --name /ec2/keypair/${keyId} --query Parameter.Value --with-decryption --output text)
  echo "$CONTENT" > "${keyId}.pem"
  chmod 400 "${keyId}.pem"
fi

ssh -i ${keyId}.pem -o IdentitiesOnly=yes ubuntu@${publicIp}`
}

function makeScpScript (keyId: string, publicIp: string): string {
  return `#!/usr/bin/env bash
set -eu

if [ ! -f "${keyId}.pem" ]; then
  CONTENT=$(env-cmd --silent aws ssm get-parameter --name /ec2/keypair/${keyId} --query Parameter.Value --with-decryption --output text)
  echo "$CONTENT" > "${keyId}.pem"
  chmod 400 "${keyId}.pem"
fi

scp -i ${keyId}.pem -o IdentitiesOnly=yes "$1" ubuntu@${publicIp}:"$2"`
}

class NvidiaRapidsEC2Stack extends Stack {
  constructor (scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const vpc = new ec2.Vpc(this, 'NvidiaRapidsEC2VPC', {
      natGateways: 0,
      subnetConfiguration: [{
        cidrMask: 24,
        name: 'asterisk',
        subnetType: ec2.SubnetType.PUBLIC
      }]
    })

    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      description: 'Allow SSH (TCP port 22) in',
      allowAllOutbound: true
    })
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH Access')

    const role = new iam.Role(this, 'ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
    })

    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'))

    const machineImage = new ec2.GenericLinuxImage({
      // https://aws.amazon.com/marketplace/server/configuration?productId=676eed8d-dcf5-4784-87d7-0de463205c17&ref_=psb_cfg_continue
      'us-east-1': 'ami-06835d15c4de57810'
    })

    const instanceType = ec2.InstanceType.of(ec2.InstanceClass.G4DN, ec2.InstanceSize.XLARGE)

    const cfnKeyPair = new ec2.CfnKeyPair(this, 'NvidiaRapidsEc2Keypair', {
      keyName: 'nvidia-rapids-ec2-keypair'
    })

    const ec2Instance = new ec2.Instance(this, 'NvidiaRapidsEC2Instance', {
      vpc,
      instanceType,
      securityGroup,
      machineImage,
      keyName: cfnKeyPair.keyName
    })

    new cdk.CfnOutput(this, 'Connect Script', { value: makeConnectScript(cfnKeyPair.attrKeyPairId, ec2Instance.instancePublicIp) })
    new cdk.CfnOutput(this, 'Scp Script', { value: makeScpScript(cfnKeyPair.attrKeyPairId, ec2Instance.instancePublicIp) })
  }
}

if (require.main === module) {
  const app = new cdk.App()
  new NvidiaRapidsEC2Stack(app, 'NvidiaRapidsEC2Stack', { env: { region: process.env.AWS_REGION ?? 'us-east-1' } })
  app.synth()
}
