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
  async handler (thingie) {
    if (thingie.new_spaze_location && thingie.location !== 'pocket') {
      const oldThingie = await MC.model.Thingie.findOne({ _id: thingie._id })
      const locationList = oldThingie.past_locations ? oldThingie.past_locations : []
      if (thingie.location !== locationList[0]) {
        const newLocationList = [thingie.location].concat(locationList).slice(0, 5)
        oldThingie.past_locations = newLocationList
        console.log(newLocationList)
        oldThingie.save()
      }
      delete thingie.new_spaze_location
    }
    const updated = await MC.model.Thingie
      .findOneAndUpdate({ _id: thingie._id }, thingie, { new: true })
      .populate({
        path: 'file_ref',
        select: 'filename file_ext aspect'
      })
    MC.socket.io.to('thingies').emit('module|update-thingie|payload', updated)
  }
})
