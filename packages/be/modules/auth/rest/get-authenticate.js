console.log('💡 [endpoint] /authenticate')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
const mongoInstances = Object.keys(MC.mongoInstances)
for (let i = 0; i < mongoInstances.length; i++) {
  const instance = mongoInstances[i]
  MC.app.get(`/${instance}/authenticate`, async (req, res) => {
    try {
      const instanceTokens = `${instance.toUpperCase().replaceAll('-', '_')}_AUTH_TOKENS`
      const token = req.query.token
      const tokensString = process.env[instanceTokens]
      const tokens = tokensString.split(',')
      if (token !== '' && tokens.includes(token)) {
        SendData(res, 200, '💫 💫 💫', true)
      } else {
        SendData(res, 200, 'oops, try another token', false)
      }
    } catch (e) {
      console.log(`===================== [Endpoint: /${instance}/authenticate]`)
      console.log(e)
      SendData(res, 200, 'ooops', false)
    }
  })
}
