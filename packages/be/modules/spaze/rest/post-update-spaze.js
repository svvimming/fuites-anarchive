console.log('💡 [endpoint] /post-update-spaze')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.post('/post-update-spaze', async (req, res) => {
  try {
    const body = req.body
    const spazeUpdates = {}
    const properties = ['connections', 'state']
    properties.forEach((prop) => {
      if (body.hasOwnProperty(prop)) {
        spazeUpdates[prop] = body[prop]
      }
    })
    const updated = await MC.model.Spaze
      .findOneAndUpdate({ name: body.name }, spazeUpdates, { new: true })
      .populate({
        path: 'portal_refs',
        populate: { path: 'thingie_ref', select: 'colors' }
      })
    MC.socket.io.to('spazes').emit('module|post-update-spaze|payload', updated)
    SendData(res, 200, 'Spaze succesfully updated', updated)
  } catch (e) {
    console.log('============================== [Endpoint: /post-update-spaze]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
