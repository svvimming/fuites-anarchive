console.log('💡 [endpoint] /post-create-thingie')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

const { GetThingieConsistencies } = require('@Module_Utilities')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.post('/post-create-thingie', async (req, res) => {
  try {
    const body = req.body
    const verse = body.verse
    const upload = await MC.model.Upload.findById(body.file_id)
    if (!upload && body.thingie_type !== 'text') {
      throw new Error('File could not be uploaded. Please try again.')
    }
    const at = body.at
    if (body.thingie_type === 'image' && upload.aspect) {
      Object.assign(at, { width: 80, height: 80 / upload.aspect })
    }
    const created = await MC.model.Thingie.create({
      file_ref: body.file_id,
      location: body.location,
      pocket_ref: body.pocket_ref,
      verse: body.verse,
      thingie_type: body.thingie_type,
      at,
      clip: false,
      creator_token: body.creator_token,
      last_update: {
        token: body.creator_token,
        timestamp: Date.now()
      },
      text: body.text,
      consistencies: [],
      colors: body.colors ? body.colors : [],
      path_data: body.path_data
    })
    await created.populate({
      path: 'file_ref',
      select: 'filename file_ext'
    })
    MC.socket.io.to(`${created.verse}/thingies`).emit('module|post-create-thingie|payload', created)
    SendData(res, 200, 'Thingie successfully created', created)
    GetThingieConsistencies(verse, created, upload)
  } catch (e) {
    console.log('============================ [Endpoint: /post-create-thingie]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
