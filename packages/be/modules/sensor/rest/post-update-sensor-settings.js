console.log('💡 [endpoint] /post-update-sensor-settings')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.post('/interweave/post-update-sensor-settings', async (req, res) => {
  try {
    const updates = req.body.updates
    const updated = []
    for (let i = 0; i < updates.length; i++) {
      const update = updates[i]
      const newSensor = await MC.mongoInstances.interweave.model.Sensor
        .findOneAndUpdate({ name: update.name }, update, { new: true })
      updated.push(newSensor)
    }
    SendData(res, 200, 'Sensors updated successfully', { updated })
  } catch (e) {
    console.log('================= [Endpoint: /interweave/get-sensor-settings]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})