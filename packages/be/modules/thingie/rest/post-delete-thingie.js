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
    const verse = req.body.verse
    const thingieId = req.body.thingieId
    const thingie = await MC.model.Thingie.findById(thingieId)
    if (!thingie) {
      throw new Error('Thingie does not exist!')
    }
    if (thingie.thingie_type !== 'text') {
      const fileId = thingie.file_ref
      const upload = await MC.model.Upload.findById(fileId)
      const fileExt = upload.file_ext
      if (!upload) {
        throw new Error('File does not exist!')
      }
      const deletedUpload = await MC.model.Upload.deleteOne(upload)
      const deletedThingie = await MC.model.Thingie.deleteOne(thingie)
      console.log(deletedUpload)
      console.log(deletedThingie)
      Fs.unlink(`${UPLOADS_DIR}/${fileId}.${fileExt}`, (err) => {
        if (err) {
          console.log(err)
        } else {
          console.log(`deleted ${fileId}.${fileExt}`)
        }
      })
    } else {
      const deletedTextThingie = await MC.model.Thingie.deleteOne(thingie)
      console.log(deletedTextThingie)
    }
    console.log(`deleted file ${thingieId}`)
    MC.socket.io
      .to(`${verse}|thingies`)
      .emit('module|post-delete-thingie|payload', { _id: thingieId })
    SendData(res, 200, 'Thingie successfully deleted', { _id: thingieId })
  } catch (e) {
    console.log('============================ [Endpoint: /post-delete-thingie]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
