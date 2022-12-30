console.log('💡 [endpoint] /get-pocket')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.get('/get-pocket', async (req, res) => {
  try {
    const token = req.query.token
    const pocket = await MC.model.Pocket.findOne({ token: token }).exec()
    SendData(res, 200, 'Dataset retrieved successfully', pocket)
  } catch (e) {
    console.log('===================================== [Endpoint: /get-pocket]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
