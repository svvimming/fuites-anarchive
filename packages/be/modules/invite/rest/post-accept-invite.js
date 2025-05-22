console.log('💡 [endpoint] /post-generate-invite')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { createHash } = require('node:crypto')
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.post('/post-accept-invite', async (req, res) => {
  try {
    const body = req.body
    const inviteId = body.invite_id
    const token = body.token

    // Validate required fields
    if (!token) {
      return SendData(res, 400, 'Token is required')
    }
    // Find invite
    const invite = await MC.model.Invite.findById(inviteId)
    if (!invite) {
      return SendData(res, 404, 'Invite not found')
    }
    // Check if invite is pending
    if (invite.status !== 'pending') {
      return SendData(res, 200, 'Invite is either already accepted or expired', {
        message: `Whoops, it looks like this invite is ${invite.status === 'expired' ? 'expired' : 'already accepted'}`,
        status: 'error'
      })
    }
    // Get pocket to add verses to
    const hashedToken = createHash('sha256').update(token).digest('hex')
    const pocket = await MC.model.Pocket.findOne({ token: hashedToken })
    if (!pocket) {
      return SendData(res, 200, 'Invalid token', {
        message: 'Whoops, it looks like this token is invalid.',
        status: 'error'
      })
    }
    // Check if pocket already has verses
    const duplicateVerses = invite.verses.filter(verse =>
      pocket.verses.some(pocketVerse => pocketVerse.toString() === verse.toString())
    )
    if (duplicateVerses.length > 0) {
      return SendData(res, 200, 'Duplicate verses found', {
        message: 'Your token already has access to this verse.',
        status: 'error'
      })
    }
    // Add verses to pocket
    pocket.verses.push(...invite.verses)
    await pocket.save()
    // Update invite status
    invite.status = 'accepted'
    await invite.save()
    // Return success
    return SendData(res, 200, 'Invite accepted', {
      message: 'Your invite has been accepted.',
      status: 'success'
    })
  } catch (e) {
    console.log('============================ [Endpoint: /post-accept-invite]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
