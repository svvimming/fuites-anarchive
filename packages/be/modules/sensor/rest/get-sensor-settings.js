console.log('💡 [endpoint] /get-sensor-settings')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.get('/interweave/get-sensor-settings', async (req, res) => {
  try {
    const sensors = await MC.mongoInstances.interweave.model.Sensor.find({})
    SendData(res, 200, 'Sensor settings retrieved successfully', sensors)
  } catch (e) {
    console.log('================= [Endpoint: /interweave/get-sensor-settings]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
