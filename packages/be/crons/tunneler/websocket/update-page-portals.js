console.log('⚡️ [websocket] cron|app|page-portals-changed')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
const mongoInstances = Object.keys(MC.mongoInstances)
for (let i = 0; i < mongoInstances.length; i++) {
  const instance = mongoInstances[i]
  MC.socket.listeners.push({
    name: `${instance}|cron|page-portals-changed|initialize`,
    handler (updated) {
      if (updated) {
        MC.socket.io
          .of(`/${instance}`)
          .to(`${instance}|pages`)
          .emit('module|post-update-page|payload', updated)
      }
    }
  })
}
