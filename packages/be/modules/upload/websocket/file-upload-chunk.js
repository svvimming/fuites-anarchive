console.log('⚡️ [websocket] module|file-upload-chunk|payload')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Path = require('path')
const Fs = require('fs-extra')

const { GetSocket } = require('@Module_Utilities')

const MC = require('@Root/config')

const TMP_UPLOADS_DIR = Path.resolve(`${MC.packageRoot}/tmp/uploads`)
const LOCAL_UPLOADS_DIR = Path.resolve(`${MC.publicRoot}/uploads`)

// Configure AWS S3 client for DigitalOcean Spaces
const s3 = new AWS.S3({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
  region: process.env.DO_SPACES_REGION
})
const BUCKET_NAME = process.env.DO_SPACES_BUCKET_NAME
// base url for uploads in DO Spaces
const env = process.env.SERVER_ENV
const bucketDir = env === 'stable' ? 'stable/uploads' : 'uploads'
const s3bucketUrl = `https://${process.env.DO_SPACES_BUCKET_NAME}.${process.env.DO_SPACES_ENDPOINT}/${bucketDir}`

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
      // If the goal is passed, write the file on the server or DO Spaces
      if (data.place > data.goal) {
        // Development environment
        if (env === 'development') {
          await Fs.move(`${TMP_UPLOADS_DIR}/${fileId}`, `${LOCAL_UPLOADS_DIR}/${fileId}.${fileExt}`)
          const upload = await MC.model.Upload.findById(fileId)
          upload.upload_status = 1
          await upload.save()
          // File upload complete
          return socket.emit(`${uploaderId}|file-upload-complete|payload`)
        }
        // Production and Stable environments
        // Upload to DigitalOcean Spaces
        const fileContent = await Fs.readFile(`${TMP_UPLOADS_DIR}/${fileId}`)
        await s3.putObject({
          Bucket: BUCKET_NAME,
          Key: `${bucketDir}/${fileId}.${fileExt}`,
          Body: fileContent,
          ACL: 'public-read'
        }).promise()
        // Clean up temporary file
        await Fs.remove(`${TMP_UPLOADS_DIR}/${fileId}`)
        // Update upload status to 1 (completed) and set file_url to the DigitalOcean Spaces URL
        const upload = await MC.model.Upload.findById(fileId)
        upload.upload_status = 1
        upload.file_url = `https://${process.env.DO_SPACES_BUCKET_NAME}.${process.env.DO_SPACES_ENDPOINT}/uploads/${fileId}.${fileExt}`
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
