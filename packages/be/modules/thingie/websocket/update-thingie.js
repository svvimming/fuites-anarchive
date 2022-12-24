console.log('⚡️ [websocket] module|update-thingie|payload')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
// const Mime = require('mime')

// const { GetSocket } = require('@Module_Utilities')

const MC = require('@Root/config')

// /////////////////////////////////////////////////////////////////// Functions
// -----------------------------------------------------------------------------
const thingieWithLocationHistory = async (incoming) => {
  const thingie = await MC.model.Thingie.findOne({ _id: incoming._id })
  const locations = thingie.last_locations ? thingie.last_locations : []
  const newVertex = {
    location: incoming.location === 'pocket' ? thingie.location : incoming.location,
    at: { x: thingie.at.x, y: thingie.at.y }
  }
  const latest = !locations.length ? [newVertex] : newVertex.location === locations[0].location || newVertex.location === 'pocket' ? [] : [newVertex]
  incoming.last_locations = latest.concat(locations).slice(0, 5)
  incoming.update_count = incoming.update_count + 1
  Object.entries(incoming).forEach(([key, value]) => { thingie[key] = value })
  const updated = await thingie.save()
  await updated.populate({
    path: 'file_ref',
    select: 'filename file_ext aspect'
  })
  return updated
}

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.socket.listeners.push({
  name: 'update-thingie',
  async handler (incoming) {
    let updated
    if (incoming.record_new_location) {
      delete incoming.record_new_location
      updated = await thingieWithLocationHistory(incoming)
    } else {
      incoming.$inc = { update_count: 1 }
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
