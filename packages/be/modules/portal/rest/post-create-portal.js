console.log('💡 [endpoint] /post-create-portal')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// ///////////////////////////////////////////////////////////////////// Exports
// -----------------------------------------------------------------------------
MC.app.post('/post-create-portal', async (req, res) => {
  try {
    const body = req.body
    const verse = body.verse
    const verseRef = body.verseRef
    const thingieRef = body.thingieRef
    const vertices = body.vertices
    // Get the page ref for the destination portal
    for (let i = 0; i < vertices.length; i++) {
      const vertex = vertices[i]
      if (!vertex.hasOwnProperty('page_ref')) {
        const dest = await MC.model.Page.findOne({ name: vertex.location, verse })
        if (dest) {
          vertices[i].page_ref = dest._id
        } else {
          SendData(res, 200, 'The destination page doesn\'t exist!')
          return
        }
      }
    }
    // Create the portal
    const created = await MC.model.Portal.create({
      verse_ref: verseRef,
      verse,
      ...(thingieRef && { thingie_ref: thingieRef }),
      manual: true,
      vertices
    })
    // Update each page with the portal ref
    for (let i = 0; i < created.vertices.length; i++) {
      const updated = await MC.model.Page.findOneAndUpdate(
        { verse, name: created.vertices[i].location },
        { $push: { portal_refs: created._id } },
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
    // Return result
    console.log(`New portal opened between ${created.vertices[0].location} and ${created.vertices[1].location}.`)
    SendData(res, 200, 'Portal successfully created', created)
  } catch (e) {
    console.log('============================= [Endpoint: /post-create-portal]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
