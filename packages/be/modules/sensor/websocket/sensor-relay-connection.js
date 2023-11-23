console.log('⚡️ [websocket] module|sensor-relay-connection|payload')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.socket.listeners.push({
  name: 'interweave|ping',
  async handler (data) {
    console.log('ping received', data)
  }
})
