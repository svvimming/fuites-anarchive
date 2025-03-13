console.log('💡 [endpoint] /authenticate')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.get('/authenticate-pocket', async (req, res) => {
  try {
    const token = req.query.token
    const localStorageAuth = req.query.localStorageAuth
    const tokensString = process.env.AUTH_TOKENS
    const tokens = tokensString.split(',')
    if (token !== '' && tokens.includes(token)) {
      const pocket = await MC.model.Pocket
        .findOne({ token })
        .populate({
          path: 'verses',
          select: 'name settings average_colors',
          populate: { path: 'page_refs', select: 'name' }
        })
      if (!pocket) {
        SendData(res, 200, 'oops, try another token', { type: 'token-not-found', pocket: false })
        return
      }
      if (!localStorageAuth) {
        // Record the manual authentication timestamp
        pocket.manualAuthDate = Date.now()
        // Increment the manual auth count
        if (typeof pocket.manualAuthCount === 'number') {
          pocket.manualAuthCount = pocket.manualAuthCount + 1
        }
        // Update the pocket document
        await pocket.save()
        SendData(res, 200, 'Pocket retrieved successfully', { type: 'manual-auth-success', pocket })
      } else if (pocket.manualAuthDate && (Date.now() - new Date(pocket.manualAuthDate).getTime()) <= 10800000) {
        SendData(res, 200, 'Pocket retrieved successfully', { type: 'local-storage-auth-success', pocket })
      } else {
        SendData(res, 200, 'oops, try another token', { type: 'local-storage-auth-failed' })
      }
    } else {
      SendData(res, 200, 'oops, try another token', { type: 'token-not-found', pocket: false })
    }
  } catch (e) {
    console.log('============================ [Endpoint: /authenticate-pocket]')
    console.log(e)
    SendData(res, 500, 'oops, something went wrong...', false)
  }
})
