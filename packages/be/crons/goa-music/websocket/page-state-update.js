console.log('⚡️ [websocket] cron|app|page-state-update')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
const mongoInstances = Object.keys(MC.mongoInstances)
for (let i = 0; i < mongoInstances.length; i++) {
  const instance = mongoInstances[i]
  MC.socket.listeners.push({
    name: `${instance}|cron|page-state-update|initialize`,
    handler (updated) {
      if (updated) {
        MC.socket.io
          .of(`/${instance}`)
          .to(`${instance}|goa`)
          .emit('module|page-state-update|payload', updated)
      }
    }
  })
}
