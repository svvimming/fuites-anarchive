console.log('💡 [endpoint] /authenticate')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { createHash } = require('node:crypto')
const { SendData } = require('@Module_Utilities')
const Path = require('path')

const MC = require('@Root/config')

require('dotenv').config({ path: Path.resolve(__dirname, '../../../.env') })

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.get('/authenticate-pocket', async (req, res) => {
  try {
    const token = req.query.token
    const localStorageAuth = req.query.localStorageAuth
    const salt = process.env.TOKEN_SALT_SECRET
    const hashedToken = createHash('sha256').update(token + salt).digest('hex')
    const pocket = await MC.model.Pocket
      .findOne({ token: hashedToken })
      .populate({
        path: 'verses',
        select: 'name settings average_colors public',
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
  } catch (e) {
    console.log('============================ [Endpoint: /authenticate-pocket]')
    console.log(e)
    SendData(res, 500, 'oops, something went wrong...', false)
  }
})
