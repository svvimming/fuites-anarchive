console.log('⚡️ [websocket] module|update-thingie|payload')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const MC = require('@Root/config')
const axios = require('axios')
const Path = require('path')

require('dotenv').config({ path: Path.resolve(__dirname, '../../../.env') })

// /////////////////////////////////////////////////////////////////// Functions
// -----------------------------------------------------------------------------
const forwardToCompostService = async (payload) => {
  try {
    const baseUrl = process.env.COMPOST_SERVICE_ADDRESS
    const endpoint = process.env.COMPOST_SERVICE_ENDPOINT
    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
    await axios.post(url, payload, { timeout: 5000 })
  } catch (err) {
    console.error('❌ [compost] forward failed:', err?.message || err)
  }
}

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.socket.listeners.push({
  name: 'update-thingie',
  async handler (incoming) {
    // Record this update timestamp and increment the global update count
    incoming.last_update.timestamp = Date.now()
    incoming.$inc = { update_count: 1 }
    let forwardToCompost = false
    // If the incoming update includes a location change, record it in the thingie's location history
    if (incoming.record_new_location) {
      delete incoming.record_new_location
      // Record timestamp if composted
      if (incoming.location === 'compost') {
        incoming.compostedAt = Date.now()
        forwardToCompost = process.env.SERVER_ENV !== 'production'
      }
      // Add new location to history
      incoming.$push = {
        location_history: {
          location: incoming.location,
          at: {
            x: incoming.at.x,
            y: incoming.at.y
          }
        }
      }
    }
    // Update the thingie
    const select = forwardToCompost ? '_id filename mimetype file_ext file_url aspect palette createdAt updatedAt' : 'filename file_ext file_url'
    const updated = await MC.model.Thingie
      .findOneAndUpdate({ _id: incoming._id }, incoming, { new: true })
      .populate({ path: 'file_ref', select })
    const data = { thingie: updated }
    // If present, record the client session ID to omit updating on that frontend
    if (incoming.hasOwnProperty('omit_session_id')) {
      data.omit_session_id = incoming.omit_session_id
    }
    // Broadcast the update to the socket
    MC.socket.io.to(`${updated.verse}|thingies`).emit('module|update-thingie|payload', data)
    // Handle composting
    if (forwardToCompost) { forwardToCompostService(data) }
  }
})
