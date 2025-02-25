console.log('⚡️ [websocket] cron|app|migrate-thingie')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.socket.listeners.push({
  name: 'cron|migrate-thingie|initialize',
  handler (thingie) {
    MC.socket.io
      .to(`${thingie.verse}|thingies`)
      .emit('module|update-thingie|payload', thingie)
  }
})
