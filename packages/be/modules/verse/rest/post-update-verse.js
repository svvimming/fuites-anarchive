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

    // Build a $set update with dot-notation so we do NOT replace the entire settings object
    const updateDoc = {}
    const isPlainObject = (val) => val && typeof val === 'object' && !Array.isArray(val)
    const flatten = (prefix, obj) => {
      Object.keys(obj).forEach((key) => {
        const value = obj[key]
        const path = `${prefix}.${key}`
        if (isPlainObject(value)) {
          flatten(path, value)
        } else {
          updateDoc[path] = value
        }
      })
    }
    if (isPlainObject(verseUpdates.settings)) {
      flatten('settings', verseUpdates.settings)
    }

    // Update the verse document (non-destructive partial update)
    const updated = await MC.model.Verse
      .findByIdAndUpdate(verseId, { $set: updateDoc }, { new: true })
      .populate({
        path: 'page_refs',
        select: 'name'
      })

    if (!updated) {
      return SendData(res, 404, 'Verse not found')
    }

    // Broadcast the update to all clients via the pluriverse room
    MC.socket.io
      .to('pluriverse')
      .emit('module|post-update-verse|payload', { verse: updated })

    SendData(res, 200, 'Verse successfully updated')
  } catch (e) {
    console.log('================= [Endpoint: /post-update-verse]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
