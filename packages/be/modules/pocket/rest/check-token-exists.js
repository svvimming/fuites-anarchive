console.log('💡 [endpoint] /check-token-exists')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { createHash } = require('node:crypto')
const { SendData } = require('@Module_Utilities')
const Path = require('path')

const MC = require('@Root/config')

require('dotenv').config({ path: Path.resolve(__dirname, '../../../.env') })

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.get('/check-token-exists', async (req, res) => {
  try {
    const token = req.query.token
    const salt = process.env.TOKEN_SALT_SECRET
    const hashedToken = createHash('sha256').update(token + salt).digest('hex')
    const pocket = await MC.model.Pocket.findOne({ token: hashedToken }).exec()
    SendData(res, 200, 'Pocket exists', !!pocket)
  } catch (e) {
    console.log('============================= [Endpoint: /check-token-exists]')
    console.log(e)
    SendData(res, 200, 'Pocket doesn\'t exist', false)
  }
})
