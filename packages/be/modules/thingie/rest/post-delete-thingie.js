console.log('💡 [endpoint] /post-delete-thingie')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Path = require('path')
const Fs = require('fs-extra')

const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

const LOCAL_UPLOADS_DIR = Path.resolve(`${MC.publicRoot}/uploads`)

// Configure AWS S3 client for DigitalOcean Spaces
const s3 = new AWS.S3({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
  region: process.env.DO_SPACES_REGION
})
const BUCKET_NAME = process.env.DO_SPACES_BUCKET_NAME
// base url DO spaces key
const env = process.env.SERVER_ENV
const bucketDir = env === 'stable' ? 'stable/uploads' : 'uploads'
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
      await MC.model.Upload.deleteOne(upload)
      await MC.model.Thingie.deleteOne(thingie)
      console.log(`Deleted upload document ${fileId} and thingie document ${thingieId}.`)
      // Development environment
      if (env === 'development') {
        // Delete file from local uploads directory
        Fs.unlink(`${LOCAL_UPLOADS_DIR}/${fileId}.${fileExt}`, (err) => {
          if (err) {
            console.log(err)
          } else {
            console.log(`Deleted ${fileId}.${fileExt} from local uploads directory.`)
          }
        })
      // Production and Stable environments
      } else {
        // Delete file from DigitalOcean Spaces
        try {
          await s3.deleteObject({
            Bucket: BUCKET_NAME,
            Key: `${bucketDir}/${fileId}.${fileExt}`
          }).promise()
          console.log(`Deleted ${bucketDir}/${fileId}.${fileExt} from DigitalOcean Spaces.`)
        } catch (err) {
          console.log(`Error deleting file ${bucketDir}/${fileId}.${fileExt} from DigitalOcean Spaces:`, err)
        }
      }
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
