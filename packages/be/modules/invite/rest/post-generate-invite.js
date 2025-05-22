console.log('💡 [endpoint] /post-generate-invite')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { createHash } = require('node:crypto')
const { SendData } = require('@Module_Utilities')
const Path = require('path')

const MC = require('@Root/config')

require('dotenv').config({ path: Path.resolve(__dirname, '../../../.env') })

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.post('/post-generate-invite', async (req, res) => {
  try {
    const body = req.body
    const verses = body.verses.split(',')
    const createdBy = body.created_by
    const generateAllowed = body.generate_allowed === 'true'
    // Validate required fields
    if (!createdBy) {
      return SendData(res, 400, 'Creator identifier is required')
    }
    // Hash creator identifier
    const salt = process.env.TOKEN_SALT_SECRET
    const hashedToken = body.hashed ? createdBy : createHash('sha256').update(createdBy + salt).digest('hex')
    // Validate required fields
    if (!verses || !Array.isArray(verses) || verses.length === 0) {
      return SendData(res, 400, 'At least one verse must be specified')
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
      created_by: hashedToken,
      generate_allowed: generateAllowed
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
