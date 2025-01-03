console.log('⚡️ [websocket] module|print-upload-chunk|payload')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Path = require('path')
const Fs = require('fs-extra')

const { GetSocket } = require('@Module_Utilities')

const MC = require('@Root/config')

const TMP_PRINTS_DIR = Path.resolve(`${MC.packageRoot}/tmp/prints`)
const PRINTS_DIR = Path.resolve(`${MC.publicRoot}/prints`)

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.socket.listeners.push({
  name: 'module|print-upload-chunk|payload',
  async handler (data) {
    try {
      const socket = GetSocket(data.socket_id)
      const chunk = data.chunk
      const printId = data.file_id
      const fileExt = data.file_ext
      const file = Fs.createWriteStream(`${TMP_PRINTS_DIR}/${printId}`, { flags: 'a' })
      file.write(chunk)
      file.end()
      if (data.place > data.goal) {
        // If the goal is passed, write the file on the server
        await Fs.move(`${TMP_PRINTS_DIR}/${printId}`, `${PRINTS_DIR}/${printId}.${fileExt}`)
        const print = await MC.model.Print.findById(printId)
        print.upload_status = 1
        await print.save()
        // Add print ref to the relevant Page
        await MC.model.Page.findOneAndUpdate({ _id: print.page_ref }, {
          init_screencap: false,
          $push: {
            print_refs: print._id
          }
        })
        // File upload complete
        return socket.emit('module|print-upload-complete|payload')
      }
      // Emit db entry _id, chunksize and an incremented chunk place of 0
      socket.emit('module|print-upload-chunk|payload', {
        file_id: printId,
        file_ext: fileExt,
        chunksize: MC.modules.uploader.chunkSize,
        place: data.place += 1,
        goal: data.goal
      })
    } catch (e) {
      console.log('[websocket: module|print-upload-chunk|payload]')
      console.log(e)
    }
  }
})
