console.log('💡 [endpoint] /post-update-page')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
const mongoInstances = Object.keys(MC.mongoInstances)
for (let i = 0; i < mongoInstances.length; i++) {
  const instance = mongoInstances[i]
  MC.app.post(`/${instance}/post-update-page`, async (req, res) => {
    try {
      const body = req.body
      const pageUpdates = {}
      const properties = ['connections', 'state', 'background', 'init_screencap']
      properties.forEach((prop) => {
        if (body.hasOwnProperty(prop)) {
          pageUpdates[prop] = body[prop]
        }
      })
      const updated = await MC.mongoInstances[instance].model.Page
        .findOneAndUpdate({ name: body.name }, pageUpdates, { new: true })
        .populate({
          path: 'portal_refs',
          populate: { path: 'thingie_ref', select: 'colors' }
        })
      MC.socket.io
        .of(`/${instance}`)
        .to(`${instance}|pages`)
        .emit('module|post-update-page|payload', updated)
      SendData(res, 200, 'Page succesfully updated', updated)
    } catch (e) {
      console.log(`================= [Endpoint: /${instance}/post-update-page]`)
      console.log(e)
      SendData(res, 500, 'Something went wrong. Please try again.')
    }
  })
}
