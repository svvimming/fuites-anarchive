console.log('💡 [endpoint] /get-invite')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.get('/get-invite', async (req, res) => {
  try {
    const inviteId = req.query.invite_id

    // Validate required fields
    if (!inviteId) {
      return SendData(res, 400, 'Invite ID is required')
    }

    // Find invite and populate verses
    const invite = await MC.model.Invite.findById(inviteId)
      .populate({
        path: 'verses',
        select: 'name settings average_colors public'
      })

    if (!invite) {
      return SendData(res, 404, 'Invite not found')
    }

    // Return invite data
    SendData(res, 200, 'Invite found', invite)
  } catch (e) {
    console.log('===================================== [Endpoint: /get-invite]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
