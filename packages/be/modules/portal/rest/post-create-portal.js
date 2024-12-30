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
    const created = await MC.model.Portal.create({
      verse: verse,
      verse_ref: verseRef,
      ...(thingieRef && { thingie_ref: thingieRef }),
      manual: true,
      vertices
    })
    for (let i = 0; i < created.vertices.length; i++) {
      const updated = await MC.model.Page.findOneAndUpdate(
        { name: created.vertices[i].location },
        { $push: { portal_refs: created._id } },
        { new: true }
      ).populate({
        path: 'portal_refs',
        populate: { path: 'thingie_ref', select: 'colors' }
      })
      MC.socket.io
        .to(`${verse}|pages`)
        .emit('module|post-update-page|payload', updated)
    }
    console.log(`New portal opened between ${created.vertices[0].location} and ${created.vertices[1].location}.`)
    SendData(res, 200, 'Portal successfully created', created)
  } catch (e) {
    console.log('============================= [Endpoint: /post-create-portal]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
