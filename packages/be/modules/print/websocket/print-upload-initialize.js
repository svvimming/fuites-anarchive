console.log('⚡️ [websocket] module|print-upload-initialize|payload')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Mime = require('mime')

const { GetSocket } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.socket.listeners.push({
  name: 'module|print-upload-initialize|payload',
  async handler (data) {
    try {
      const socket = GetSocket(data.socket_id)
      const mimetype = data.mimetype
      const filesize = data.filesize
      const fileExt = Mime.getExtension(mimetype)
      const chunksize = MC.modules.uploader.chunkSize
      // Create database entry
      const created = await MC.model.Print.create({
        filename: data.filename,
        page_ref: data.page_ref,
        mimetype,
        filesize,
        file_ext: fileExt,
        upload_status: 0
      })
      // Emit db entry _id, chunksize and a start chunk place of 0
      socket.emit('module|print-upload-chunk|payload', {
        file_id: created._id,
        file_ext: fileExt,
        chunksize,
        place: 0,
        goal: filesize / chunksize // how many steps to reach 100% downloaded
      })
    } catch (e) {
      console.log('[websocket: module|print-upload-initialize|payload]')
      console.log(e)
    }
  }
})
