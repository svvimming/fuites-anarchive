console.log('💡 [endpoint] /post-update-pocket')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.post('/post-update-pocket', async (req, res) => {
  try {
    const body = req.body
    const pocket = await MC.model.Pocket.findOneAndUpdate(
      { token: body.token },
      { thingies: req.body.thingies },
      { new: true }
    )
    SendData(res, 200, 'Dataset updated successfully', pocket)
  } catch (e) {
    console.log('============================= [Endpoint: /post-update-pocket]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
