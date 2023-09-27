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
const mongoInstances = Object.keys(MC.mongoInstances)
for (let i = 0; i < mongoInstances.length; i++) {
  const instance = mongoInstances[i]
  MC.app.post(`/${instance}/post-delete-thingie`, async (req, res) => {
    try {
      const thingieId = req.body.thingie_id
      const thingie = await MC.mongoInstances[instance].model.Thingie.findById(thingieId)
      if (!thingie) {
        throw new Error('File does not exist!')
      }
      if (thingie.thingie_type !== 'text') {
        const fileId = thingie.file_ref
        const upload = await MC.mongoInstances[instance].model.Upload.findById(fileId)
        const fileExt = upload.file_ext
        if (!upload) {
          throw new Error('File does not exist!')
        }
        const deletedUpload = await MC.mongoInstances[instance].model.Upload.deleteOne(upload)
        const deletedThingie = await MC.mongoInstances[instance].model.Thingie.deleteOne(thingie)
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
        const deletedTextThingie = await MC.mongoInstances[instance].model.Thingie.deleteOne(thingie)
        console.log(deletedTextThingie)
      }
      console.log(`deleted file ${thingieId}`)
      MC.socket.io
        .of(`/${instance}`)
        .to(`${instance}|thingies`)
        .emit('module|post-delete-thingie|payload', thingieId)
      SendData(res, 200, 'Thingie successfully deleted', 'deleted thingie')
    } catch (e) {
      console.log(`============== [Endpoint: /${instance}/post-delete-thingie]`)
      console.log(e)
      SendData(res, 500, 'Something went wrong. Please try again.')
    }
  })
}
