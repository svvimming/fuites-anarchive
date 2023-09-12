console.log('💡 [endpoint] /get-page-background')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.get('/get-page-background', async (req, res) => {
  try {
    const query = req.query
    const print = await MC.model.Print.findOne({ _id: query.print })
    SendData(res, 200, 'Print retrieved successfully', print)
  } catch (e) {
    console.log('============================ [Endpoint: /get-page-background]')
    console.log(e)
    SendData(res, 500, 'Something went wrong retrieving page backgound.')
  }
})
