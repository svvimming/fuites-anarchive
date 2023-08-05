console.log('⚡️ [websocket] cron|app|page-state-update')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.socket.listeners.push({
  name: 'cron|page-state-update|initialize',
  handler (updated) {
    if (updated) {
      MC.socket.io.to('cron|goa').emit('module|page-state-update|payload', updated)
    }
  }
})
