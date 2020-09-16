// https://github.com/microsoft/vscode/blob/1.45.1/extensions/typescript-language-features/src/utils/wireProtocol.ts
// VSCode 1.45.1 wireProtocol.ts 处理逻辑

const defaultSize = 8192;
const contentLength = 'Content-Length: ';
const contentLengthSize = Buffer.byteLength(contentLength, 'utf8');
const blank = Buffer.from(' ', 'utf8')[0];
const backslashR = Buffer.from('\r', 'utf8')[0];
const backslashN = Buffer.from('\n', 'utf8')[0];

class ProtoBuffer {
  constructor() {
    Object.assign(this, {
      index: 0,
      buffer: Buffer.allocUnsafe(defaultSize),
    });
  }

  append(data) {
    // 如果 buffer 长度够用
    if (this.buffer.length - this.index >= data.length) {
      data.copy(this.buffer, this.index, 0, data.length);
    } else {
      // 扩充 buffer 大小
      const bufferCount = Math.ceil((this.index + data.length) / defaultSize) + 1
      let newSize = bufferCount * defaultSize;
      if (this.index === 0) {
        this.buffer = Buffer.allocUnsafe(newSize);
        data.copy(this.buffer, 0, 0, data.length);
      } else {
        this.buffer = Buffer.concat([this.buffer.slice(0, this.index), data], newSize);
      }
    }

    // 调整总长度
    this.index += data.length;
  }

  // 编码格式为：Content-Length: ${length}\r\n\r\n${json}${newLine};
  tryReadContentLength() {
    let result = -1;
    let current = 0;

    // 略去前导空白字符
    while (current < this.index && (this.buffer[current] === blank || this.buffer[current] === backslashR || this.buffer[current] === backslashN)) {
      current++;
    }

    // 如果总消息长度比消息头还要短
    if (this.index < current + contentLengthSize) {
      return result;
    }

    // 略过消息头 “Content-Length: ”，读后面的内容
    current += contentLengthSize;

    // 读到 \r 为止 “Content-Length: ${length}\r”
    let start = current;
    while (current < this.index && this.buffer[current] !== backslashR) {
      current++;
    }

    // 后面必须是 \n\r\n “Content-Length: ${length}\r\n\r\n”
    if (current + 3 >= this.index || this.buffer[current + 1] !== backslashN || this.buffer[current + 2] !== backslashR || this.buffer[current + 3] !== backslashN) {
      return result;
    }

    // 解析到消息的长度 ${length}
    let data = this.buffer.toString('utf8', start, current);
    result = parseInt(data);

    // 只保留 \r\n\r\n 之后的部分，调整 buffer 中的总消息程度
    this.buffer = this.buffer.slice(current + 4);
    this.index = this.index - (current + 4);

    return result;
  }

  // 读取长为 length 的消息
  tryReadContent(length) {
    // 如果 buffer 中的总消息长度不够
    if (this.index < length) {
      return null;
    }

    // 读取长为 length 的消息
    let result = this.buffer.toString('utf8', 0, length);

    // 略过后面的 ${newLine}
    let sourceStart = length;
    while (sourceStart < this.index && (this.buffer[sourceStart] === backslashR || this.buffer[sourceStart] === backslashN)) {
      sourceStart++;
    }

    // 从 sourceStart 开始的后面部分，拷贝到 this.buffer 开始位置
    this.buffer.copy(this.buffer, 0, sourceStart);
    // 长度减去相应的 length
    this.index = this.index - sourceStart;
    return result;
  }
}

module.exports = ProtoBuffer;
