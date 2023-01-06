console.log('⚡️ [websocket] cron|app|digest-compost-thingie')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.socket.listeners.push({
  name: 'cron|digest-compost-thingie|initialize',
  handler (id) {
    console.log(id)
    MC.socket.io.to('thingies').emit('module|post-delete-thingie|payload', id)
  }
})
