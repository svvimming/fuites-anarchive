console.log('💡 [endpoint] /post-delete-thingie')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Path = require('path')
const Fs = require('fs-extra')

const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

const UPLOADS_DIR = Path.resolve(`${MC.publicRoot}/uploads`)

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.post('/post-delete-thingie', async (req, res) => {
  try {
    const thingieId = req.body.thingie_id
    const thingie = await MC.model.Thingie.findById(thingieId)
    const fileId = thingie.file_ref
    const upload = await MC.model.Upload.findById(fileId)
    const fileExt = upload.file_ext
    if (!thingie || !upload) {
      throw new Error('File does not exist!')
    }
    const deletedUpload = await MC.model.Upload.deleteOne(upload)
    const deletedThingie = await MC.model.Thingie.deleteOne(thingie)
    Fs.unlink(`${UPLOADS_DIR}/${fileId}.${fileExt}`, (err) => {
      if (err) {
        console.log(err)
      } else {
        console.log(`deleted ${fileId}.${fileExt}`)
      }
    })
    MC.socket.io.to('thingies').emit('module|post-delete-thingie|payload', thingieId)
    SendData(res, 200, 'Thingie successfully deleted', `deleted file ${fileId}.${fileExt}`)
  } catch (e) {
    console.log('================== [Endpoint: /post-delete-thingie]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})