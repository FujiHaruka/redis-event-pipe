const {createClient} = require('redis')
const {serialize, deserialize} = require('./helpers')

class RedisEventPipe {
  constructor (redisConfig) {
    this.pub = createClient(redisConfig)
    this.sub = createClient(redisConfig)
    this.eventPrefix = 'redis:'
  }

  wrap (EventEmitter, options = {}) {
    const {sub, pub, eventPrefix} = this
    const {restrict} = options
    const shouldExclude = (eventName) => {
      return Boolean(restrict && !restrict.includes(eventName))
    }
    const channelFor = (eventName) => eventPrefix + eventName

    class WrappedEventEmitter extends EventEmitter {
      on (eventName, listener) {
        if (shouldExclude(eventName)) {
          super.on(eventName, listener)
          return
        }
        const channel = channelFor(eventName)
        sub.on('message', (chan, message) => {
          if (chan !== channel) {
            return
          }
          const data = deserialize(message)
          listener(...data)
        })
        sub.subscribe(channel)
      }

      emit (eventName, ...args) {
        if (shouldExclude(eventName)) {
          super.emit(eventName, ...args)
          return
        }
        const channel = channelFor(eventName)
        const message = serialize(args)
        pub.publish(channel, message)
      }

      onSubscribe (eventName, listener) {
        sub.on('subscribe', (channel, count) => {
          if (channel === channelFor(eventName)) {
            listener()
          }
        })
      }
    }

    Object.assign(WrappedEventEmitter, {
      ...EventEmitter,
    })

    return WrappedEventEmitter
  }
}

module.exports = RedisEventPipe
