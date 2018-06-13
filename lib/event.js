const EventEmitter = require('events')

const e = new EventEmitter()

e.on('some', console.log)

e.emit('some', {a: 1}, {b: 2}, {c: new Date()}, {e: e})
