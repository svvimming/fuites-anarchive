console.log('💡 [endpoint] /post-update-verse')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.post('/post-update-verse', async (req, res) => {
  try {
    const body = req.body
    const verseId = body._id
    const verseUpdates = {}

    // List of properties that can be updated
    const properties = ['settings']

    // Check if any of the allowed properties are present in the request body
    properties.forEach((prop) => {
      if (body.hasOwnProperty(prop)) {
        verseUpdates[prop] = body[prop]
      }
    })

    // If no valid updates were provided, return an error
    if (Object.keys(verseUpdates).length === 0) {
      return SendData(res, 400, 'No valid properties provided for update')
    }

    // Update the verse document
    const updated = await MC.model.Verse
      .findByIdAndUpdate(verseId, verseUpdates, { new: true })
      .populate({
        path: 'page_refs',
        select: 'name'
      })

    if (!updated) {
      return SendData(res, 404, 'Verse not found')
    }

    // Broadcast the update to all clients via the multiverse room
    MC.socket.io
      .to('multiverse')
      .emit('module|post-update-verse|payload', { verse: updated })

    SendData(res, 200, 'Verse successfully updated')
  } catch (e) {
    console.log('================= [Endpoint: /post-update-verse]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
