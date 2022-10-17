import * as fs from 'fs'

const content = fs.readFileSync('cdk-output.json').toString()
const decoded = JSON.parse(content)
if ('FreeEC2Stack' in decoded && 'ConnectScript' in decoded.FreeEC2Stack) {
  fs.writeFileSync('connect.sh', decoded.FreeEC2Stack.ConnectScript)
}
