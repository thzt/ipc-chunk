const fs = require('fs');
const path = require('path');
const readline = require('readline');

// https://github.com/microsoft/TypeScript/blob/v3.7.3/src/server/session.ts#L128
// mock TypeScript 3.7.3 LSP formatMessage 处理逻辑
const mockResponseMessage = () => {
  const mockFilePath = path.join(__dirname, './mock/completionInfo.json');
  const content = fs.readFileSync(mockFilePath, 'utf-8');
  const msg = JSON.parse(content);
  const json = JSON.stringify(msg);
  const len = Buffer.byteLength(json, 'utf8');
  const newLine = '\n';
  const response = `Content-Length: ${1 + len}\r\n\r\n${json}${newLine}`;

  return response;
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

const mockMessage = mockResponseMessage();
rl.on('line', line => {
  // 虽然这里是一次性发送，但实际会拆分为多个单元进行发送
  process.stdout.write(mockMessage);
});
