console.log('💡 [endpoint] /get-traces')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.get('/get-traces', async (req, res) => {
  try {
    const traces = await MC.model.Trace.find({}).sort({ createdAt: -1 }).limit(1)
    SendData(res, 200, 'Traces retrieved successfully', traces[0])
  } catch (e) {
    console.log('===================================== [Endpoint: /get-traces]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
