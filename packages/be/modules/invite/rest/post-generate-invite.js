console.log('💡 [endpoint] /post-generate-invite')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.post('/post-generate-invite', async (req, res) => {
  try {
    const body = req.body
    const verses = body.verses.split(',')
    const createdBy = body.created_by

    // Validate required fields
    if (!verses || !Array.isArray(verses) || verses.length === 0) {
      return SendData(res, 400, 'At least one verse must be specified')
    }
    if (!createdBy) {
      return SendData(res, 400, 'Creator identifier is required')
    }

    // Set expiration date (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const verseDocs = await MC.model.Verse.find({ name: { $in: verses } })

    // Create invite
    const created = await MC.model.Invite.create({
      verses: verseDocs.map(v => v._id),
      status: 'pending',
      expires_at: expiresAt,
      created_by: createdBy
    })

    const data = { url: `${MC.frontendUrl}/invite?id=${created._id}` }
    // Send response
    SendData(res, 200, 'Invite successfully created', data)
  } catch (e) {
    console.log('============================ [Endpoint: /generate-invite]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
