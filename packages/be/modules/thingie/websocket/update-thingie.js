console.log('⚡️ [websocket] module|update-thingie|payload')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const MC = require('@Root/config')

// /////////////////////////////////////////////////////////////////// Functions
// -----------------------------------------------------------------------------
const thingieWithLocationHistory = async (instance, incoming) => {
  const thingie = await MC.mongoInstances[instance].model.Thingie.findOne({ _id: incoming._id })
  const locations = thingie.last_locations ? thingie.last_locations : []
  const newVertex = {
    location: (incoming.location === 'pocket' || incoming.location === 'compost') ? thingie.location : incoming.location,
    at: { x: thingie.at.x, y: thingie.at.y }
  }
  const latest = !locations.length ? [newVertex] : newVertex.location === locations[0].location || newVertex.location === 'pocket' || incoming.location === 'compost' ? [] : [newVertex]
  incoming.last_locations = latest.concat(locations).slice(0, 5).filter(item => item.location !== 'pocket' && item.location !== 'compost')
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
const mongoInstances = Object.keys(MC.mongoInstances)
for (let i = 0; i < mongoInstances.length; i++) {
  const instance = mongoInstances[i]
  MC.socket.listeners.push({
    name: `${instance}|update-thingie`,
    async handler (incoming) {
      let updated
      if (incoming.record_new_location) {
        delete incoming.record_new_location
        if (incoming.location === 'compost') {
          incoming.compostedAt = Date.now()
        }
        updated = await thingieWithLocationHistory(instance, incoming)
      } else {
        incoming.$inc = { update_count: 1 }
        updated = await MC.mongoInstances[instance].model.Thingie
          .findOneAndUpdate({ _id: incoming._id }, incoming, { new: true })
          .populate({
            path: 'file_ref',
            select: 'filename file_ext aspect'
          })
      }
      MC.socket.io
        .of(`/${instance}`)
        .to(`${instance}|thingies`)
        .emit('module|update-thingie|payload', updated)
    }
  })
}
