console.log('⚡️ [websocket] cron|app|spaze-portals-changed')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.socket.listeners.push({
  name: 'cron|spaze-portals-changed|initialize',
  handler (updated) {
    if (updated) {
      MC.socket.io.to('spazes').emit('module|post-update-spaze|payload', updated)
    }
  }
})
