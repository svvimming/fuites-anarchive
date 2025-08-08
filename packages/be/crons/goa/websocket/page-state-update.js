console.log('⚡️ [websocket] cron|app|page-state-update')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.socket.listeners.push({
  name: 'cron|page-state-update|initialize',
  handler (updated) {
    const verse = updated?.verse
    if (verse) {
      MC.socket.io
        .to(`${verse}|pages`)
        .emit('module|post-update-page|payload', { page: updated })
    }
  }
})
