console.log('💡 [endpoint] /post-create-thingie')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.post('/post-create-thingie', async (req, res) => {
  try {
    const body = req.body
    const upload = await MC.model.Upload.findById(body.file_id)
    if (!upload) {
      throw new Error('File could not be uploaded. Please try again.')
    }
    const created = await MC.model.Thingie.create({
      file_ref: body.file_id,
      location: 'pocket',
      at: {
        x: Math.random() * 300,
        y: Math.random() * 300,
        z: Math.random() * 300
      },
      width: 80,
      angle: 0
    })
    await created.populate({
      path: 'file_ref',
      select: 'filename file_ext'
    })
    MC.socket.io.to('thingies').emit('module|post-create-thingie|payload', created)
    SendData(res, 200, 'Dataset created succesfully', created)
  } catch (e) {
    console.log('================== [Endpoint: /post-create-thingie]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
