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
      overflow_spaze: body.overflow_spaze ? body.overflow_spaze : '',
      initiator_token: body.session_token,
      creator_thingie: body.creator_thingie,
      consistencies: body.consistencies ? body.consistencies : []
    })
    if (created.overflow_spaze) {
      await MC.model.Spaze.findOneAndUpdate({ name: created.overflow_spaze }, { state: 'leaking' }, { new: true })
    }
    const compostThingies = await MC.model.Thingie.find({ location: 'compost' }).select('_id')
    if (compostThingies.length) {
      const thingieToMove = compostThingies[Math.floor(Math.random() * compostThingies.length)]
      await MC.model.Thingie.findOneAndUpdate({ _id: thingieToMove._id }, {
        location: body.spaze_name,
        at: {
          x: 683 + Math.random() * 1266,
          y: 500 + Math.random() * 800,
          z: 1
        }
      }, { new: true })
    }
    MC.socket.io.to('spazes').emit('module|post-create-spaze|payload', created)
    SendData(res, 200, 'Spaze succesfully created', created)
  } catch (e) {
    console.log('================== [Endpoint: /post-create-spaze]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
