console.log('💡 [endpoint] /check-token-exists')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { createHash } = require('node:crypto')
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.get('/check-token-exists', async (req, res) => {
  try {
    const token = req.query.token
    const hashedToken = createHash('sha256').update(token).digest('hex')
    const pocket = await MC.model.Pocket.findOne({ token: hashedToken }).exec()
    SendData(res, 200, 'Pocket exists', !!pocket)
  } catch (e) {
    console.log('============================= [Endpoint: /check-token-exists]')
    console.log(e)
    SendData(res, 200, 'Pocket doesn\'t exist', false)
  }
})
