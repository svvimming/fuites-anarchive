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
    const edge = `${body.vertices[0].location}_${body.vertices[1].location}`
    const vertices = {
      a: body.vertices[0],
      b: body.vertices[1]
    }
    const created = await MC.model.Portal.create({
      thingie_ref: body.thingieId,
      edge,
      vertices,
      enabled: true,
      manual: true
    })
    for (let i = 0; i < body.vertices.length; i++) {
      const updated = await MC.model.Page.findOneAndUpdate(
        { name: body.vertices[i].location },
        { $push: { portal_refs: created._id } },
        { new: true }
      ).populate({
        path: 'portal_refs',
        populate: { path: 'thingie_ref', select: 'colors' }
      })
      console.log(updated)
      MC.socket.io
        .of(`${verse}`)
        .to(`${verse}|pages`)
        .emit('module|post-update-page|payload', updated)
    }
    console.log(`New portal opened between ${created.edge.replace('_', ' and ')}.`)
    SendData(res, 200, 'Portal successfully created', created)
  } catch (e) {
    console.log('============================= [Endpoint: /post-create-portal]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
