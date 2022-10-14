console.log('💡 [endpoint] /authenticate')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.get('/authenticate', async (req, res) => {
  try {
    const token = req.query.token
    const tokens = process.env.AUTH_TOKENS
    if (token !== '' && tokens.includes(token)) {
      SendData(res, 200, 'You are authenticated', true)
    } else {
      SendData(res, 200, 'You are not authorized', false)
    }
  } catch (e) {
    console.log('=================================== [Endpoint: /authenticate]')
    console.log(e)
    SendData(res, 200, 'You are not authorized', false)
  }
})
