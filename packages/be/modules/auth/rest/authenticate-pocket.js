console.log('💡 [endpoint] /authenticate')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.get('/authenticate-pocket', async (req, res) => {
  try {
    const verse = req.query.verse
    const token = req.query.token
    const tokensString = process.env.REFACTOR_AUTH_TOKENS
    const tokens = tokensString.split(',')
    if (token !== '' && tokens.includes(token)) {
      const pocket = await MC.model.Pocket
        .findOne({ verses: { $in: verse }, token })
        .populate({
          path: 'verses',
          select: 'name'
        })
      SendData(res, 200, 'Pocket retrieved successfully', pocket)
    } else {
      SendData(res, 200, 'oops, try another token', false)
    }
  } catch (e) {
    console.log('============================ [Endpoint: /authenticate-pocket]')
    console.log(e)
    SendData(res, 200, 'oops, something went wrong...', false)
  }
})
