console.log('💡 [endpoint] /post-delete-thingie')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Path = require('path')
const AWS = require('aws-sdk')
require('dotenv').config({ path: Path.resolve(__dirname, '../../../.env') })

const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// Configure AWS S3 client for DigitalOcean Spaces
const s3 = new AWS.S3({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
  region: process.env.DO_SPACES_REGION
})

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.post('/post-delete-thingie', async (req, res) => {
  try {
    const env = process.env.SERVER_ENV
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
      // Delete file from DigitalOcean Spaces
      try {
        await s3.deleteObject({
          Bucket: process.env.DO_SPACES_BUCKET_NAME,
          Key: `${env === 'stable' ? 'stable/' : ''}uploads/${fileId}.${fileExt}`
        }).promise()
        console.log(`Deleted ${fileId}.${fileExt} from DigitalOcean Spaces`)
      } catch (err) {
        console.log(`Error deleting file ${fileId}.${fileExt} from DigitalOcean Spaces:`, err)
      }
    } else {
      const deletedTextThingie = await MC.model.Thingie.deleteOne(thingie)
      console.log(deletedTextThingie)
    }
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
