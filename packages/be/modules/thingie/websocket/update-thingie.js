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
    const updated = await MC.model.Thingie
      .findOneAndUpdate({ _id: thingie._id }, thingie, { new: true })
      .populate({
        path: 'file_ref',
        select: 'filename file_ext aspect'
      })
    MC.socket.io.to('thingies').emit('module|update-thingie|payload', updated)
  }
})
