console.log('⚡️ [websocket] module|file-upload-initialize|payload')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Mime = require('mime')

const { GetSocket } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
const mongoInstances = Object.keys(MC.mongoInstances)
for (let i = 0; i < mongoInstances.length; i++) {
  const instance = mongoInstances[i]
  MC.socket.listeners.push({
    name: `${instance}|module|file-upload-initialize|payload`,
    async handler (data) {
      try {
        const socket = GetSocket(data.socket_id, instance)
        const mimetype = data.mimetype
        const filesize = data.filesize
        const fileExt = Mime.getExtension(mimetype)
        const chunksize = MC.modules.uploader.chunkSize
        // Create database entry
        const created = await MC.mongoInstances[instance].model.Upload.create({
          filename: data.filename,
          mimetype,
          filesize,
          file_ext: fileExt,
          aspect: data.aspect,
          palette: data.palette,
          upload_status: 0,
          form_metadata: data.form_metadata
        })
        // Emit db entry _id, chunksize and a start chunk place of 0
        socket.emit(`${instance}|module|file-upload-chunk|payload`, {
          file_id: created._id,
          file_ext: fileExt,
          chunksize,
          place: 0,
          goal: filesize / chunksize // how many steps to reach 100% downloaded
        })
      } catch (e) {
        console.log(`[websocket: ${instance}|module|file-upload-initialize|payload]`)
        console.log(e)
      }
    }
  })
}
