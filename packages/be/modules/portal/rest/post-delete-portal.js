console.log('💡 [endpoint] /post-delete-portal')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// ///////////////////////////////////////////////////////////////////// Exports
// -----------------------------------------------------------------------------
MC.app.post('/post-delete-portal', async (req, res) => {
  try {
    const { portalId, verse } = req.body
    const portal = await MC.model.Portal.findById(portalId)
    if (!portal) {
      SendData(res, 404, 'Portal not found')
      return
    }
    const vertices = portal.vertices
    for (let i = 0; i < vertices.length; i++) {
      const updated = await MC.model.Page.findOneAndUpdate(
        { verse, name: vertices[i].location },
        { $pull: { portal_refs: portalId } },
        { new: true }
      ).populate({
        path: 'portal_refs',
        sort: { createdAt: 1 },
        populate: [
          {
            path: 'thingie_ref',
            select: 'colors'
          },
          {
            path: 'vertices.page_ref',
            select: 'print_refs'
          }
        ]
      })
      // Broadcast page updates to the socket connection
      MC.socket.io
        .to(`${verse}|pages`)
        .emit('module|post-update-page|payload', { page: updated })
    }
    // Delete the portal
    await MC.model.Portal.deleteOne(portal)
    console.log(`Deleted portal ${portalId}`)
    SendData(res, 200, 'Portal deleted successfully')
  } catch (e) {
    console.log('============================ [Endpoint: /post-delete-portal]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
