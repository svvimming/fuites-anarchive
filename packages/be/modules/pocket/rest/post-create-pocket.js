console.log('💡 [endpoint] /post-create-pocket')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Bcrypt = require('bcrypt')
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.post('/post-create-pocket', async (req, res) => {
  try {
    const body = req.body
    const inviteId = body.invite_id
    const token = body.token

    // Validate required fields
    if (!inviteId) {
      return SendData(res, 400, 'Invite ID is required')
    }

    // Find invite
    const invite = await MC.model.Invite.findById(inviteId)
    if (!invite) {
      return SendData(res, 404, 'Invite not found')
    }

    // Check if invite is expired
    if (invite.status === 'expired' || new Date() > invite.expires_at) {
      if (invite.status !== 'expired') {
        invite.status = 'expired'
        await invite.save()
      }
      return SendData(res, 400, 'Invite has expired')
    }

    // Check if invite is already accepted
    if (invite.status === 'accepted') {
      return SendData(res, 400, 'Invite has already been accepted')
    }

    // Create pocket
    const hashedToken = await Bcrypt.hash(token, 10)
    await MC.model.Pocket.create({
      verses: invite.verses,
      token: hashedToken
    })

    invite.status = 'accepted'
    await invite.save()

    // Return invite status
    SendData(res, 200, 'Token successfully generated')
  } catch (e) {
    console.log('============================= [Endpoint: /post-create-pocket]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
