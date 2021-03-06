import Queue from './Queue'
import * as JsonBuffer from './JsonBuffer'

export default class MessageBus<Msg> {
  stream: NodeJS.ReadWriteStream
  sendQ: Queue<Msg>
  receiveQ: Queue<Msg>

  constructor(stream: NodeJS.ReadWriteStream, subscriber?: (msg: Msg) => void) {
    this.stream = stream

    this.sendQ = new Queue('MessageBus:sendQ')
    this.receiveQ = new Queue('MessageBus:receiveQ')

    this.stream
      .on('data', this.onData)
      .once('close', () => this.close())
      .once('error', () => this.close())

    this.sendQ.subscribe((msg) => {
      this.stream.write(JsonBuffer.bufferify(msg))
    })

    if (subscriber) this.subscribe(subscriber)
  }

  onData = (data: Buffer): void => {
    this.receiveQ.push(JsonBuffer.parse(data))
  }

  send(msg: Msg): void {
    this.sendQ.push(msg)
  }

  subscribe(onMsg: (msg: Msg) => void): void {
    this.receiveQ.subscribe(onMsg)
  }

  unsubscribe(): void {
    this.receiveQ.unsubscribe()
  }

  close(): void {
    this.sendQ.unsubscribe()
    this.receiveQ.unsubscribe()
    this.stream.end()
  }
}
