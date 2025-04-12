console.log('💡 [endpoint] /post-generate-invite')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Bcrypt = require('bcrypt')
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
      return SendData(res, 400, 'Invite is either already accepted or expired')
    }
    // Get pocket to add verses to
    const hashedToken = await Bcrypt.hash(token, 10)
    const pocket = await MC.model.Pocket.findOne({ token: hashedToken })
    if (!pocket) {
      return SendData(res, 400, 'Invalid token')
    }
    // Add verses to pocket
    pocket.verses.push(...invite.verses)
    await pocket.save()
    // Update invite status
    invite.status = 'accepted'
    await invite.save()
    // Return success
    return SendData(res, 200, 'Invite accepted')
  } catch (e) {
    console.log('============================ [Endpoint: /post-accept-invite]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
