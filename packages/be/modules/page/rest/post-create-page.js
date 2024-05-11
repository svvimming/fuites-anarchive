console.log('💡 [endpoint] /post-create-page')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
const mongoInstances = Object.keys(MC.mongoInstances)
for (let i = 0; i < mongoInstances.length; i++) {
  const instance = mongoInstances[i]
  MC.app.post(`/${instance}/post-create-page`, async (req, res) => {
    try {
      const body = req.body
      if (body.page_name === 'pocket') {
        SendData(res, 400, 'Error: cannot name a page \'pocket\'!', false)
        return
      }
      const created = await MC.mongoInstances[instance].model.Page.create({
        name: body.page_name,
        overflow_page: body.overflow_page ? body.overflow_page : '',
        initiator_token: body.session_token,
        creator_thingie: body.creator_thingie,
        consistencies: body.consistencies ? body.consistencies : []
      })
      if (created.overflow_page) {
        await MC.mongoInstances[instance].model.Page.findOneAndUpdate({ name: created.overflow_page }, { state: 'leaking' }, { new: true })
      }
      const compostThingies = await MC.mongoInstances[instance].model.Thingie.find({ location: 'compost' }).select('_id')
      if (compostThingies.length) {
        const thingieToMove = compostThingies[Math.floor(Math.random() * compostThingies.length)]
        await MC.mongoInstances[instance].model.Thingie.findOneAndUpdate({ _id: thingieToMove._id }, {
          location: created.name,
          at: {
            x: 683 + Math.random() * 1266,
            y: 500 + Math.random() * 800,
            z: 1
          }
        }, { new: true })
      }
      MC.socket.io
        .of(`/${instance}`)
        .to(`${instance}|pages`)
        .emit('module|post-create-page|payload', created)
      SendData(res, 200, 'Page succesfully created', created)
    } catch (e) {
      console.log(`================= [Endpoint: /${instance}/post-create-page]`)
      console.log(e)
      SendData(res, 500, 'Something went wrong. Please try again.')
    }
  })
}
