// ///////////////////////////////////////////////////// Imports + general setup
// -----------------------------------------------------------------------------
const ModuleAlias = require('module-alias')
const Path = require('path')
const Fs = require('fs-extra')
const Express = require('express')
const AWS = require('aws-sdk')
require('dotenv').config({ path: Path.resolve(__dirname, '../../.env') })

const MC = require('../../config')

const UPLOADS_DIR = Path.resolve(`${MC.publicRoot}/uploads`)
const PRINTS_DIR = Path.resolve(`${MC.publicRoot}/prints`)

// ///////////////////////////////////////////////////////////////////// Aliases
ModuleAlias.addAliases({
  '@Root': MC.packageRoot,
  '@Static': `${MC.packageRoot}/static`,
  '@Public': `${MC.packageRoot}/public`,
  '@Cache': `${MC.packageRoot}/cache`,
  '@Modules': `${MC.packageRoot}/modules`
})

try {
  const modulesRoot = `${MC.packageRoot}/modules`
  const items = Fs.readdirSync(modulesRoot)
  items.forEach((name) => {
    const path = `${modulesRoot}/${name}`
    if (Fs.statSync(path).isDirectory()) {
      const moduleName = (name[0].toUpperCase() + name.substring(1)).replace(/-./g, x => x[1].toUpperCase())
      ModuleAlias.addAlias(`@Module_${moduleName}`, path)
    }
  })
} catch (e) {
  console.log(e)
}

// ///////////////////////////////////////////////////////////////////// Modules
require('@Module_Database')
require('@Module_Upload')
require('@Module_Print')

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------
MC.app = Express()

// Configure AWS S3 client for DigitalOcean Spaces
const s3 = new AWS.S3({
  endpoint: process.env.DO_SPACES_ENDPOINT,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
  region: process.env.DO_SPACES_REGION
})

/**
 * @method migrateServerUploadsToSpacesBucket
 */

const migrateServerUploadsToSpacesBucket = async () => {
  const uploads = await MC.model.Upload.find({})
  const len = uploads.length
  for (let i = 0; i < len; i++) {
    const upload = uploads[i]
    const fileId = upload._id.toString()
    const fileExt = upload.file_ext
    const filePath = `${UPLOADS_DIR}/${fileId}.${fileExt}`
    // Check if file exists before proceeding
    const fileExists = await Fs.pathExists(filePath)
    if (!fileExists) {
      console.log(`File not found: ${filePath}`)
      continue
    }

    const fileContent = await Fs.readFile(filePath)
    await s3.putObject({
      Bucket: process.env.DO_SPACES_BUCKET_NAME,
      Key: `uploads/${fileId}.${fileExt}`,
      Body: fileContent,
      ACL: 'public-read'
    }).promise()
    // Update upload doc with DO Spaces URL
    upload.file_url = `https://${process.env.DO_SPACES_BUCKET_NAME}.${process.env.DO_SPACES_ENDPOINT}/uploads/${fileId}.${fileExt}`
    await upload.save()
    console.log(`Upload ${`https://fuit.es/api/uploads/${fileId}.${fileExt}`} migrated to ${upload.file_url}. Finished ${i + 1} of ${len}.`)
  }
}

/**
 * @method migrateServerPrintsToSpacesBucket
 */

const migrateServerPrintsToSpacesBucket = async () => {
  const prints = await MC.model.Print.find({})
  const len = prints.length
  for (let i = 0; i < len; i++) {
    const print = prints[i]
    const fileId = print._id.toString()
    const fileExt = print.file_ext
    const filePath = `${PRINTS_DIR}/${fileId}.${fileExt}`
    // Check if file exists before proceeding
    const fileExists = await Fs.pathExists(filePath)
    if (!fileExists) {
      console.log(`File not found: ${filePath}`)
      continue
    }

    const fileContent = await Fs.readFile(filePath)
    await s3.putObject({
      Bucket: process.env.DO_SPACES_BUCKET_NAME,
      Key: `prints/${fileId}.${fileExt}`,
      Body: fileContent,
      ACL: 'public-read'
    }).promise()
    // Update print doc with DO Spaces URL
    print.file_url = `https://${process.env.DO_SPACES_BUCKET_NAME}.${process.env.DO_SPACES_ENDPOINT}/prints/${fileId}.${fileExt}`
    await print.save()
    console.log(`Print ${`https://fuit.es/api/prints/${fileId}.${fileExt}`} migrated to ${print.file_url}. Finished ${i + 1} of ${len}.`)
  }
}

// ///////////////////////////////////////////////////////////////////////// Run
// -----------------------------------------------------------------------------
MC.app.on('mongoose-connected', async () => {
  try {
    console.log('------------------------------- Beginning upload migration')
    await migrateServerUploadsToSpacesBucket()
    console.log('------------------------------- Uploads successfully migrated')
    console.log('------------------------------- Beginning print migration')
    await migrateServerPrintsToSpacesBucket()
    console.log('------------------------------- Prints successfully migrated')
    console.log('------------------------------- Migration completed')
    process.exit(0)
  } catch (e) {
    console.log('===================================== [Cron: Upload Migrator]')
    console.log(e)
    process.exit(0)
  }
})
