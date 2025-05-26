console.log('⚡️ [websocket] module|print-upload-chunk|payload')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Path = require('path')
const Fs = require('fs-extra')
const AWS = require('aws-sdk')
require('dotenv').config({ path: Path.resolve(__dirname, '../../../.env') })

const { GetSocket } = require('@Module_Utilities')

const MC = require('@Root/config')

const TMP_PRINTS_DIR = Path.resolve(`${MC.packageRoot}/tmp/prints`)

// Configure AWS S3 client for DigitalOcean Spaces
const s3 = new AWS.S3({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
  region: process.env.DO_SPACES_REGION
})

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.socket.listeners.push({
  name: 'module|print-upload-chunk|payload',
  async handler (data) {
    try {
      const env = process.env.SERVER_ENV
      const socket = GetSocket(data.socket_id)
      const chunk = data.chunk
      const printId = data.file_id
      const fileExt = data.file_ext
      const file = Fs.createWriteStream(`${TMP_PRINTS_DIR}/${printId}`, { flags: 'a' })
      file.write(chunk)
      file.end()
      if (data.place > data.goal) {
        // Upload to DigitalOcean Spaces
        const fileContent = await Fs.readFile(`${TMP_PRINTS_DIR}/${printId}`)
        await s3.putObject({
          Bucket: process.env.DO_SPACES_BUCKET_NAME,
          Key: `${env === 'stable' ? 'stable/' : ''}prints/${printId}.${fileExt}`,
          Body: fileContent,
          ACL: 'public-read'
        }).promise()

        // Clean up temporary file
        await Fs.remove(`${TMP_PRINTS_DIR}/${printId}`)
        // Update upload status to 1 (completed) and set file_url to the DigitalOcean Spaces URL
        const print = await MC.model.Print.findById(printId)
        print.upload_status = 1
        // Store the file URL in the database
        if (env === 'stable') {
          print.file_url = `https://${process.env.DO_SPACES_BUCKET_NAME}.${process.env.DO_SPACES_ENDPOINT}/stable/prints/${printId}.${fileExt}`
        } else if (env === 'production') {
          print.file_url = `https://${process.env.DO_SPACES_BUCKET_NAME}.${process.env.DO_SPACES_ENDPOINT}/prints/${printId}.${fileExt}`
        }
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
