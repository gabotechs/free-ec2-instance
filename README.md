# Free Ec2 instance

Deploy an instance in AWS for you to play around.

## Install

Install the dependencies
```shell
yarn install
```
create a `.env` file with your credentials in the root of the project, 
next to the `package.json` file
```dotenv
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-access-key-secret
```
Bootstrap the environment
```shell
yarn bootstrap
```

## Deploy

Deploy the new EC2 instance
```shell
yarn deploy
```
It should take a couple of minutes. After the deployment is completed,
you can connect to your instance with:
```shell
yarn connect
```

## Destroy

Whenever you want to tear down the EC2 instance just use:
```shell
yarn destroy
```
