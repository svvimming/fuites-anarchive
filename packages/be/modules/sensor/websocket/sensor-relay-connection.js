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
    // find thingies listening to sensor data
    const listening = await MC.mongoInstances.interweave.model.Thingie
      .find({ sensors_active: { $in: [sensor] } })
    // update thingies and pack in updates array
    const updates = []
    data.$inc = { update_count: 1 }
    for (let i = 0; i < listening.length; i++) {
      const update = await MC.mongoInstances.interweave.model.Thingie
        .findOneAndUpdate({ _id: listening[i]._id }, data, { new: true })
        .populate({
          path: 'file_ref',
          select: 'filename file_ext aspect'
        })
      updates.push(update)
    }
    MC.socket.io
      .of('/interweave')
      .to('interweave|thingies')
      .emit('module|sensor-data-update|payload', updates)
  }
})
