import * as fs from 'fs'

const content = fs.readFileSync('cdk-output.json').toString()
const decoded = JSON.parse(content)
if ('NvidiaRapidsEC2Stack' in decoded && 'ConnectScript' in decoded.NvidiaRapidsEC2Stack) {
  fs.writeFileSync('connect.sh', decoded.NvidiaRapidsEC2Stack.ConnectScript)
}

if ('NvidiaRapidsEC2Stack' in decoded && 'ScpScript' in decoded.NvidiaRapidsEC2Stack) {
  fs.writeFileSync('scp.sh', decoded.NvidiaRapidsEC2Stack.ScpScript)
}
