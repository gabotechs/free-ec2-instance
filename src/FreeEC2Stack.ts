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

ssh -i ${keyId}.pem -o IdentitiesOnly=yes ec2-user@${publicIp}`
}


function makeScpScript (keyId: string, publicIp: string): string {
  return `#!/usr/bin/env bash
set -eu

if [ ! -f "${keyId}.pem" ]; then
  CONTENT=$(env-cmd --silent aws ssm get-parameter --name /ec2/keypair/${keyId} --query Parameter.Value --with-decryption --output text)
  echo "$CONTENT" > "${keyId}.pem"
  chmod 400 "${keyId}.pem"
fi

scp -i ${keyId}.pem -o IdentitiesOnly=yes "$1" ec2-user@${publicIp}:"$2"`
}

class FreeEC2Stack extends Stack {
  constructor (scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const vpc = new ec2.Vpc(this, 'FreeEC2VPC', {
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

    const machineImage = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: ec2.AmazonLinuxCpuType.ARM_64
    })

    const instanceType = ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO)

    const cfnKeyPair = new ec2.CfnKeyPair(this, 'FreeEc2Keypair', {
      keyName: 'free-ec2-keypair'
    })

    const ec2Instance = new ec2.Instance(this, 'FreeEC2Instance', {
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
  new FreeEC2Stack(app, 'FreeEC2Stack', { env: { region: process.env.AWS_REGION ?? 'us-east-1' } })
  app.synth()
}
