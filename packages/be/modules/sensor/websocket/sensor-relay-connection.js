console.log('⚡️ [websocket] module|sensor-relay-connection|payload')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.socket.listeners.push({
  name: 'interweave|sensor-data',
  async handler (data) {
    // console.log(data)
    const sensors = await MC.mongoInstances.interweave.model.Sensor.find({})
    const activePage = sensors[0].page
    // console.log(sensors)
    // find thingies listening to sensor data
    const listening = await MC.mongoInstances.interweave.model.Thingie
      .find({ location: activePage, sensors: { $gt: 0 } })
    // update thingies and pack them in and updates array
    const updates = []
    for (let i = 0; i < listening.length; i++) {
      const thingie = listening[i]
      const active = thingie.sensors_active
      const props = { $inc: { update_count: 1 } }
      let css = []
      active.forEach((sensor) => {
        const settings = sensors.find(sr => sr.name === sensor)
        const voltageDif = (settings.inputVoltage.max - settings.inputVoltage.min)
        const outputDif = (settings.outputRange.max - settings.outputRange.min)
        const val = (data[sensor] - settings.inputVoltage.min) * (outputDif / voltageDif) + settings.outputRange.min
        if (settings.affecting === 'css') {
          css = css.concat(settings.css?.map(str => str.split('?').join(`${val}`)))
        } else {
          props[settings.affecting] = val
        }
      })
      if (css.length) {
        props.css = css
      }
      const update = await MC.mongoInstances.interweave.model.Thingie
        .findOneAndUpdate({ _id: thingie._id }, props, { new: true })
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
