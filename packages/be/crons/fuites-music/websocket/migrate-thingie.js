console.log('⚡️ [websocket] cron|app|migrate-thingie')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
const mongoInstances = Object.keys(MC.mongoInstances)
for (let i = 0; i < mongoInstances.length; i++) {
  const instance = mongoInstances[i]
  MC.socket.listeners.push({
    name: `${instance}|cron|migrate-thingie|initialize`,
    handler (thingie) {
      MC.socket.io
        .of(`/${instance}`)
        .to(`${instance}|goa`)
        .emit('module|fuites-migrate-thingie|payload', thingie)
    }
  })
}
