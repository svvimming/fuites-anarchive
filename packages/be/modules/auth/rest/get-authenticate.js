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
    const tokensString = process.env.AUTH_TOKENS
    const tokens = tokensString.split(',')
    if (token !== '' && tokens.includes(token)) {
      SendData(res, 200, '💫 💫 💫', true)
    } else {
      SendData(res, 200, 'oops, try another token', false)
    }
  } catch (e) {
    console.log('=================================== [Endpoint: /authenticate]')
    console.log(e)
    SendData(res, 200, 'ooops', false)
  }
})
