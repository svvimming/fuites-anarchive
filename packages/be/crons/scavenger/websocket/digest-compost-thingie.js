console.log('⚡️ [websocket] cron|app|digest-compost-thingie')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
const mongoInstances = Object.keys(MC.mongoInstances)
for (let i = 0; i < mongoInstances.length; i++) {
  const instance = mongoInstances[i]
  MC.socket.listeners.push({
    name: `${instance}|cron|digest-compost-thingie|initialize`,
    handler (id) {
      console.log(`deleted thingie ${id}`)
      MC.socket.io
        .of(`/${instance}`)
        .to(`${instance}|thingies`)
        .emit('module|post-delete-thingie|payload', id)
    }
  })
}
