console.log('⚡️ [websocket] cron|app|page-portals-changed')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.socket.listeners.push({
  name: 'cron|page-portals-changed|initialize',
  handler (updated) {
    if (updated) {
      MC.socket.io.to('pages').emit('module|post-update-page|payload', updated)
    }
  }
})