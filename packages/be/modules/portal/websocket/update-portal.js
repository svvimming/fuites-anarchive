console.log('⚡️ [websocket] module|update-portal|payload')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.socket.listeners.push({
  name: 'update-portal',
  async handler (incoming) {
    const updated = await MC.model.Portal
      .findOneAndUpdate({ _id: incoming._id }, incoming, { new: true })
      .populate([
        {
          path: 'thingie_ref',
          select: 'colors'
        },
        {
          path: 'vertices.page_ref',
          select: 'print_refs'
        }
      ])
    const data = { portal: updated }
    data.omit_session_id = incoming.omit_session_id
    MC.socket.io.to(`${updated.verse}|portals`).emit('module|update-portal|payload', data)
  }
})
