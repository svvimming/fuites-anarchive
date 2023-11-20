console.log('⚡️ [websocket] module|sensor-data-update|payload')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.socket.listeners.push({
  name: 'interweave|sensor-data-update',
  async handler (sensor, incoming) {
    incoming.$inc = { update_count: 1 }
    const updated = await MC.mongoInstances.interweave.model.Thingie
      .updateMany({ sensors_active: { $in: [sensor] } }, incoming, { new: true })
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