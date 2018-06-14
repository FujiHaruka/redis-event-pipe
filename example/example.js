const RedisPubSubRelay = require('../lib')
const relay = new RedisPubSubRelay()
const EventEmitter = require('events')

const WrappedEmitter = relay.wrap(EventEmitter)
const emitter = new WrappedEmitter()

emitter.on('something', (data) => {
  console.log(data)
  relay.quitClients()
})

emitter.onSubscribe('something', () => {
  emitter.emit('something', {
    number: 110,
    string: 'foo',
    null: null,
    array: [],
    date: new Date(),
  })
})
