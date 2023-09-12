console.log('💡 [endpoint] /post-update-page')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.post('/post-update-page', async (req, res) => {
  try {
    const body = req.body
    const pageUpdates = {}
    const properties = ['connections', 'state', 'background', 'init_screencap']
    properties.forEach((prop) => {
      if (body.hasOwnProperty(prop)) {
        pageUpdates[prop] = body[prop]
      }
    })
    const updated = await MC.model.Page
      .findOneAndUpdate({ name: body.name }, pageUpdates, { new: true })
      .populate({
        path: 'portal_refs',
        populate: { path: 'thingie_ref', select: 'colors' }
      })
    MC.socket.io.to('pages').emit('module|post-update-page|payload', updated)
    SendData(res, 200, 'Page succesfully updated', updated)
  } catch (e) {
    console.log('============================== [Endpoint: /post-update-page]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
