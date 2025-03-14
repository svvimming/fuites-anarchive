console.log('💡 [endpoint] /check-token-exists')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.get('/check-token-exists', async (req, res) => {
  try {
    const token = req.query.token
    const pocket = await MC.model.Pocket.findOne({ token }).exec()
    SendData(res, 200, 'Pocket exists', pocket ? true : false)
  } catch (e) {
    console.log('============================= [Endpoint: /check-token-exists]')
    console.log(e)
    SendData(res, 200, 'Pocket doesn\'t exist', false)
  }
})
