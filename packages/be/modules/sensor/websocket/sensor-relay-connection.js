console.log('⚡️ [websocket] module|sensor-relay-connection|payload')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.socket.listeners.push({
  name: 'interweave|sensor-data',
  async handler (sensor, data) {
    console.log('ping received', sensor, data)
    data.$inc = { update_count: 1 }
    const updated = await MC.mongoInstances.interweave.model.Thingie
      .updateMany({ sensors_active: { $in: [sensor] } }, data, { new: true })
      .populate({
        path: 'file_ref',
        select: 'filename file_ext aspect'
      })
    MC.socket.io
      .of('/interweave')
      .to('interweave|thingies')
      .emit('module|sensor-data-update|payload', updated)
  }
})
