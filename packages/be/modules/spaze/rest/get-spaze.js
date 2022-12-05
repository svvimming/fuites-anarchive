console.log('💡 [endpoint] /get-spaze')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.get('/get-spazes', async (req, res) => {
  try {
    const spazes = await MC.model.Spaze.find({})
    SendData(res, 200, 'Dataset retrieved successfully', spazes)
  } catch (e) {
    console.log('=================================== [Endpoint: /get-spazes]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
