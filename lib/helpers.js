const EJSON = require('ejson')

function serialize (array) {
  return EJSON.stringify(array)
}

function deserialize (message) {
  return EJSON.parse(message)
}

module.exports = {
  serialize,
  deserialize,
}
