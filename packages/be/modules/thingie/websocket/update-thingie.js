console.log('⚡️ [websocket] module|update-thingie|payload')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
// TODO: Need to add a socket event to emit to the pocket when on the
// compost that will create thingies in the collections store as they
// are sent to the compost from other pages.
// This is the only page where this is necessary as thingies never
// move directly between pages other than via the pocket.
// It is also necessary for movements between pages made by the fuites cron.
// Currently thingies moving between pages (not via the
// pocket) will disappear from a page in real time but not appear
// on the new page unless it is refreshed.
// This is low priority as it doesn't break anything to not have
// thingies appear.

MC.socket.listeners.push({
  name: 'update-thingie',
  async handler (incoming) {
    // Record this update timestamp and increment the global update count
    incoming.last_update.timestamp = Date.now()
    incoming.$inc = { update_count: 1 }
    // If the incoming update includes a location change, record it in the thingie's location history
    if (incoming.record_new_location) {
      delete incoming.record_new_location
      // Record timestamp if composted
      if (incoming.location === 'compost') { incoming.compostedAt = Date.now() }
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
    const updated = await MC.model.Thingie
      .findOneAndUpdate({ _id: incoming._id }, incoming, { new: true })
      .populate({
        path: 'file_ref',
        select: 'filename file_ext file_url'
      })
    const data = { thingie: updated }
    // If present, record the client session ID to omit updating on that frontend
    if (incoming.hasOwnProperty('omit_session_id')) {
      data.omit_session_id = incoming.omit_session_id
    }
    // Broadcast the update to the socket
    MC.socket.io.to(`${updated.verse}|thingies`).emit('module|update-thingie|payload', data)
  }
})
