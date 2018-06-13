const RedisEventPipe = require('../lib/RedisEventPipe')
const pipe = new RedisEventPipe()
const EventEmitter = require('events')

const WrappedEmitter = pipe.wrap(EventEmitter)
const emitter = new WrappedEmitter()

emitter.on('some', (data) => {
  console.log('some event happens')
  console.log(data)
})

emitter.onSubscribe('some', () => {
  emitter.emit('some', {a: 110})
})
