console.log('💡 [endpoint] /post-create-thingie')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

const { GetThingieConsistencies } = require('@Module_Utilities')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
const mongoInstances = Object.keys(MC.mongoInstances)
for (let i = 0; i < mongoInstances.length; i++) {
  const instance = mongoInstances[i]
  MC.app.post(`/${instance}/post-create-thingie`, async (req, res) => {
    try {
      const body = req.body
      const upload = await MC.mongoInstances[instance].model.Upload.findById(body.file_id)
      if (!upload && body.thingie_type !== 'text') {
        throw new Error('File could not be uploaded. Please try again.')
      }
      const created = await MC.mongoInstances[instance].model.Thingie.create({
        file_ref: body.file_id,
        location: body.location,
        at: {
          x: body.at ? body.at.x : 60 + Math.random() * 500,
          y: body.at ? body.at.y : 200 + Math.random() * 200,
          z: 1
        },
        width: body.width ? body.width : 80,
        angle: 0,
        clip: false,
        creator_token: body.creator_token,
        last_update_token: body.last_update_token ? body.last_update_token : body.creator_token,
        thingie_type: body.thingie_type,
        text: body.text,
        fontsize: body.fontsize ? body.fontsize : 13,
        fontfamily: body.fontfamily ? body.fontfamily : '',
        consistencies: [],
        colors: body.colors ? body.colors : [],
        path_data: body.pathData
      })
      await created.populate({
        path: 'file_ref',
        select: 'filename file_ext aspect'
      })
      MC.socket.io
        .of(`/${instance}`)
        .to(`${instance}|thingies`)
        .emit('module|post-create-thingie|payload', created)
      SendData(res, 200, 'Thingie successfully created', created)
      GetThingieConsistencies(instance, created, upload)
    } catch (e) {
      console.log(`============== [Endpoint: /${instance}/post-create-thingie]`)
      console.log(e)
      SendData(res, 500, 'Something went wrong. Please try again.')
    }
  })
}
