const path = require('path');
const { spawn } = require('child_process');
const ProtoBuffer = require('./util/buffer');

const childFilePath = path.join(__dirname, './child.js');

const main = () => {
  const protoBuffer = new ProtoBuffer();

  // 启动子进程
  const child = spawn('node', [
    '--inspect-brk=9001',
    childFilePath,
  ]);

  // 初始化 待处理的消息长度
  let nextMessageLength = -1;
  child.stdout.on('data', data => {
    // 每次接受到的 data 是一个 buffer，长度为 8192

    // 将收到的 buffer 暂存起来
    protoBuffer.append(data);
    while (true) {
      // 如果还没读取到消息长度
      if (nextMessageLength === -1) {
        // 获取消息长度
        nextMessageLength = protoBuffer.tryReadContentLength();
        if (nextMessageLength === -1) {
          // 如果还无法获取消息长度
          return;
        }
      }

      // 已经读到了消息程度，就尝试读取内容
      const msg = protoBuffer.tryReadContent(nextMessageLength);
      if (msg == null) {
        // 要读取的内容还未发送完
        return;
      }
      nextMessageLength = -1;

      // 解析为 json
      const json = JSON.parse(msg);
      onData(json);
    }
  });

  const onData = json => {
    debugger
  };

  // 发送两条消息，用于验证上述处理逻辑可以处理 多条 被拆分的消息
  // 为了触发子进程 on('line') 事件，消息应以 \n 结尾
  child.stdin.write('1');
  child.stdin.write('\n');

  child.stdin.write('2');
  child.stdin.write('\n');
};

main();
