console.log('💡 [endpoint] /post-create-thingie')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

const { GetThingieConsistencies, GetThingieClipPath } = require('@Module_Utilities')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.post('/post-create-thingie', async (req, res) => {
  try {
    const body = req.body
    const upload = await MC.model.Upload.findById(body.file_id)
    if (!upload && body.thingie_type !== 'text') {
      throw new Error('File could not be uploaded. Please try again.')
    }
    const pathData = await GetThingieClipPath(body.pathData, 'bezier')
    const created = await MC.model.Thingie.create({
      file_ref: body.file_id,
      location: body.location,
      at: {
        x: body.at ? body.at.x : 60 + Math.random() * 500,
        y: body.at ? body.at.y : 200 + Math.random() * 200,
        z: 1
      },
      width: body.width ? body.width : 80,
      angle: 0,
      clip: true,
      creator_token: body.creator_token,
      last_update_token: body.last_update_token ? body.last_update_token : body.creator_token,
      thingie_type: body.thingie_type,
      text: body.text,
      fontsize: body.fontsize ? body.fontsize : 13,
      fontfamily: body.fontfamily ? body.fontfamily : '',
      consistencies: [],
      colors: body.colors ? body.colors : [],
      path_data: pathData
    })
    await created.populate({
      path: 'file_ref',
      select: 'filename file_ext aspect'
    })
    MC.socket.io.to('thingies').emit('module|post-create-thingie|payload', created)
    SendData(res, 200, 'Thingie successfully created', created)
    GetThingieConsistencies(created, upload)
  } catch (e) {
    console.log('================== [Endpoint: /post-create-thingie]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
