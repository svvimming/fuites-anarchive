console.log('⚡️ [websocket] cron|app|page-portals-changed')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.socket.listeners.push({
  name: 'cron|page-portals-changed|initialize',
  handler (updated) {
    const verse = updated?.verse
    if (verse) {
      MC.socket.io
        .to(`${verse}|pages`)
        .emit('module|post-update-page|payload', { page: updated })
    }
  }
})
