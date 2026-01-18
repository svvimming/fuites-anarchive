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
    const verse = req.verse
    const pageUpdates = {}
    const properties = ['connections', 'state', 'background', 'init_screencap']
    properties.forEach((prop) => {
      if (body.hasOwnProperty(prop)) {
        pageUpdates[prop] = body[prop]
      }
    })
    const updated = await MC.model.Page
      .findOneAndUpdate({ verse, name: body.name }, pageUpdates, { new: true })
      .populate({
        path: 'portal_refs',
        populate: { path: 'thingie_ref', select: 'colors' }
      })
    MC.socket.io
      .to(`${verse}|pages`)
      .emit('module|post-update-page|payload', { page: updated })
    SendData(res, 200, 'Page succesfully updated', { page: updated })
  } catch (e) {
    console.log('================= [Endpoint: /post-update-page]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
