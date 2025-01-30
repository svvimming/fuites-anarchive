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
    // For new image thingie
    const at = body.at
    if (body.thingie_type === 'image' && upload.aspect) {
      Object.assign(at, { width: 80, height: 80 / upload.aspect })
    }
    // For new sound thingie
    if (body.thingie_type === 'sound') {
      const lastThingie = await MC.model.Thingie.findOne({
        verse,
        thingie_type: ['image', 'text'],
        'last_update.token': body.creator_token
      }, { colors: 1 }, {
        sort: { 'last_update.timestamp': -1 }
      })
      body.colors = lastThingie.colors.slice(0, 1)
    }
    // Create thingie
    const created = await MC.model.Thingie.create({
      file_ref: body.file_id,
      location: body.location,
      pocket_ref: body.pocket_ref,
      verse,
      at,
      thingie_type: body.thingie_type,
      clip: false,
      creator_token: body.creator_token,
      last_update: {
        token: body.creator_token,
        timestamp: Date.now()
      },
      location_history: [{
        location: body.location,
        at: { x: at.x, y: at.y }
      }],
      text: body.text,
      consistencies: [],
      colors: body.colors ? body.colors : [],
      path_data: body.path_data
    })
    await created.populate({
      path: 'file_ref',
      select: 'filename file_ext'
    })
    // Broadcast created thingie to socket
    MC.socket.io.to(`${created.verse}|thingies`).emit('module|post-create-thingie|payload', created)
    // Send response
    SendData(res, 200, 'Thingie successfully created', created)
    // Add consistencies to image thingies
    if (created.thingie_type === 'image') {
      GetThingieConsistencies(created, upload)
    }
  } catch (e) {
    console.log('============================ [Endpoint: /post-create-thingie]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
