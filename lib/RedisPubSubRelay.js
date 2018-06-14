const {createClient} = require('redis')
const {serialize, deserialize} = require('./helpers')
const crypto = require('crypto')

class RedisPubSubRelay {
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
    const classPrefix = crypto.randomBytes(4).toString('hex')
    const channelFor = (eventName) => eventPrefix + classPrefix + eventName
    const wrapSubListener = (channel, listener) => (chan, message) => {
      if (chan !== channel) {
        return
      }
      const data = deserialize(message)
      listener(...data)
    }

    class WrappedEventEmitter extends EventEmitter {

      constructor (...args) {
        super(...args)
        this._wrappedMethods = new Map()
      }

      // -----------------------
      // Override methods
      // -----------------------

      on (eventName, listener) {
        if (shouldExclude(eventName)) {
          super.on(eventName, listener)
          return
        }
        const channel = channelFor(eventName)
        const subListener = wrapSubListener(channel, listener)
        sub.on('message', subListener)
        sub.subscribe(channel)
        this._wrappedMethods.set(listener, subListener)
        return this
      }

      once (eventName, listener) {
        if (shouldExclude(eventName)) {
          return super.once(eventName, listener)
        }
        const channel = channelFor(eventName)
        const subListener = wrapSubListener(channel, listener)
        const subListenerWithCleanup = (chan, message) => {
          this._wrappedMethods.delete(listener)
          subListener(chan, message)
        }
        sub.once('message', subListenerWithCleanup)
        this._wrappedMethods.set(listener, subListenerWithCleanup)
        return this
      }

      emit (eventName, ...args) {
        if (shouldExclude(eventName)) {
          return super.emit(eventName, ...args)
        }
        const channel = channelFor(eventName)
        const message = serialize(args)
        pub.publish(channel, message)
      }

      removeListener (eventName, listener) {
        if (shouldExclude(eventName)) {
          return super.removeListener(eventName, listener)
        }
        const subListener = this._wrappedMethods.get(listener)
        sub.removeListener('message', subListener)
        this._wrappedMethods.delete(listener)
      }

      // -----------------------
      // Custom methods
      // -----------------------

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

  quitClients () {
    this.pub.quit()
    this.sub.quit()
  }
}

module.exports = RedisPubSubRelay
