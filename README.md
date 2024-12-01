# Free Ec2 instance

Deploy an instance in AWS for you to play around.

> **NOTE**: ⚠️ This project will deploy a t4g.micro ec2 instance
in the configured account, last time I checked, that was free, but
make sure to check it again.

## Install

Clone the project

```shell
git clone https://github.com/gabotechs/free-ec2-instance
cd free-ec2-instance
```

Install the dependencies
```shell
npm install
```
create a `.env` file with your credentials in the root of the project, 
next to the `package.json` file
```dotenv
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-access-key-secret
```

## Deploy

Deploy the new EC2 instance
```shell
npm run deploy
```
It should take a couple of minutes. After the deployment is completed,
you can connect to your instance with:
```shell
npm run connect
```

## Destroy

Whenever you want to tear down the EC2 instance just use:
```shell
npm run destroy
```

## Disclaimer

> **NOTE**: ⚠️ The contributors of this project are not responsible for
costs created in your AWS account, people that use this project are responsible for
their own AWS costs.
