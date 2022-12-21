console.log('⚡️ [websocket] module|update-thingie|payload')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
// const Mime = require('mime')

// const { GetSocket } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.socket.listeners.push({
  name: 'update-thingie',
  async handler (incoming) {
    let updated
    if (incoming.new_spaze_location) {
      delete incoming.new_spaze_location
      const thingie = await MC.model.Thingie.findOne({ _id: incoming._id })
      const lastLocations = thingie.last_locations ? thingie.last_locations : []
      if (incoming.location !== 'pocket') {
        if (!lastLocations.length) {
          incoming.last_locations = [{ location: incoming.location }]
        } else if (incoming.location !== lastLocations[0].location) {
          incoming.last_locations = [{ location: incoming.location }].concat(lastLocations).slice(0, 5)
        }
      } else {
        thingie.last_locations[0].at = {
          x: thingie.at.x,
          y: thingie.at.y
        }
      }
      Object.entries(incoming).forEach(([key, value]) => { thingie[key] = value })
      updated = await thingie.save()
      await updated.populate({
        path: 'file_ref',
        select: 'filename file_ext aspect'
      })
    } else {
      updated = await MC.model.Thingie
        .findOneAndUpdate({ _id: incoming._id }, incoming, { new: true })
        .populate({
          path: 'file_ref',
          select: 'filename file_ext aspect'
        })
    }
    MC.socket.io.to('thingies').emit('module|update-thingie|payload', updated)
  }
})
