console.log('⚡️ [websocket] module|file-upload-chunk|payload')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Path = require('path')
const Fs = require('fs-extra')

const { GetSocket } = require('@Module_Utilities')

const MC = require('@Root/config')

const TMP_UPLOADS_DIR = Path.resolve(`${MC.packageRoot}/tmp/uploads`)
const UPLOADS_DIR = Path.resolve(`${MC.publicRoot}/uploads`)

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.socket.listeners.push({
  name: 'module|file-upload-chunk|payload',
  async handler (data) {
    try {
      const socket = GetSocket(data.socket_id)
      const uploaderId = data.uploader_id
      const chunk = data.chunk
      const fileId = data.file_id
      const fileExt = data.file_ext
      const file = Fs.createWriteStream(`${TMP_UPLOADS_DIR}/${fileId}`, { flags: 'a' })
      file.write(chunk)
      file.end()
      if (data.place > data.goal) {
        await Fs.move(`${TMP_UPLOADS_DIR}/${fileId}`, `${UPLOADS_DIR}/${fileId}.${fileExt}`)
        const upload = await MC.model.Upload.findById(fileId)
        upload.upload_status = 1
        await upload.save()
        // File upload complete
        return socket.emit(`${uploaderId}|file-upload-complete|payload`)
      }
      // Emit db entry _id, chunksize and an incremented chunk place of 0
      socket.emit(`${uploaderId}|file-upload-chunk|payload`, {
        file_id: fileId,
        file_ext: fileExt,
        chunksize: MC.modules.uploader.chunkSize,
        place: data.place += 1,
        goal: data.goal
      })
    } catch (e) {
      console.log('[websocket: module|file-upload-chunk|payload]')
      console.log(e)
    }
  }
})
