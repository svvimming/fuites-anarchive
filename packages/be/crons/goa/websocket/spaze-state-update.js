console.log('⚡️ [websocket] cron|app|spaze-state-update')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.socket.listeners.push({
  name: 'cron|spaze-state-update|initialize',
  handler (updated) {
    if (updated) {
      MC.socket.io.to('cron|goa').emit('module|spaze-state-update|payload', updated)
    }
  }
})
