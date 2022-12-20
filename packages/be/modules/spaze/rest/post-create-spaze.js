console.log('💡 [endpoint] /post-create-spaze')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.post('/post-create-spaze', async (req, res) => {
  try {
    const body = req.body
    const created = await MC.model.Spaze.create({
      name: body.spaze_name,
      connections: body.connections,
      initiator_token: body.session_token,
      creator_thingie: body.creator_thingie
    })
    const updated = await MC.model.Thingie
      .findOneAndUpdate({ _id: created.creator_thingie }, { location: created.name }, { new: true })
      .populate({
        path: 'file_ref',
        select: 'filename file_ext aspect'
      })
    MC.socket.io.to('thingies').emit('module|update-thingie|payload', updated)
    MC.socket.io.to('spazes').emit('module|post-create-spaze|payload', created)
    SendData(res, 200, 'Spaze succesfully created', created)
  } catch (e) {
    console.log('================== [Endpoint: /post-create-spaze]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
