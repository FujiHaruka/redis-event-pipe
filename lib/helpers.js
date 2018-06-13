function serialize (array) {
  return JSON.stringify(array)
}

function deserialize (message) {
  return JSON.parse(message)
}

module.exports = {
  serialize,
  deserialize,
}
