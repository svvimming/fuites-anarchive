/**
 *
 * ⏱️️ [Cron | every day]
 * digests thingies in the compost
 *
 */
console.log('🪱️ [cron] Scavenger')

// ///////////////////////////////////////////////////// Imports + general setup
// -----------------------------------------------------------------------------
const ModuleAlias = require('module-alias')
const Path = require('path')
const Fs = require('fs-extra')
const Express = require('express')
const argv = require('minimist')(process.argv.slice(2))
const instance = argv.instance
require('dotenv').config({ path: Path.resolve(__dirname, '../../.env') })

const MC = require('../../config')

const UPLOADS_DIR = Path.resolve(`${MC.publicRoot}/uploads/${instance}`)

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

const { GenerateWebsocketClient } = require(`${MC.packageRoot}/modules/utilities`)

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------
MC.app = Express()

const socket = GenerateWebsocketClient(instance)

// ===================================================================== connect
socket.on('connect', () => { socket.emit('join-room', `${instance}|cron|websocket`) })

// /////////////////////////////////////////////////////////////////// Functions
// -------------------------------------------------------------- cleanupUploads
const cleanupUploads = async () => {
  try {
    const uploadFiles = Fs.readdirSync(UPLOADS_DIR)
    const files = uploadFiles.length
    const uploadDocuments = await MC.mongoInstances[instance].model.Upload.find({})
    const deletedFiles = []
    for (let i = 0; i < files; i++) {
      const file = uploadFiles[i]
      const uploadId = file.split('.')[0]
      const uploadExists = uploadDocuments.find(doc => doc._id.toString() === uploadId)
      if (!uploadExists) {
        Fs.unlink(`${UPLOADS_DIR}/${file}`, (err) => {
          if (err) {
            console.log(err)
          } else {
            console.log(`deleted file ${file} from the uploads directory.`)
          }
        })
      }
    }
    if (deletedFiles.length) {
      console.log('deleted the following files from uploads:')
      console.log(deletedFiles)
    }
    const len = uploadDocuments.length
    for (let i = 0; i < len; i++) {
      const upload = uploadDocuments[i]
      const uploadFileExists = Fs.existsSync(`${UPLOADS_DIR}/${upload._id.toString()}.${upload.file_ext}`)
      if (!uploadFileExists) {
        await MC.mongoInstances[instance].model.Upload.deleteOne({ _id: upload._id })
        console.log(`deleted upload document ${upload._id}.`)
      }
    }
  } catch (e) {
    console.log('================================= [Scavenger: cleanupUploads]')
    console.log(e)
  }
}

// ------------------------------------------------------------- cleanupThingies
const cleanupThingies = async () => {
  try {
    const pageBounds = {}
    const pages = await MC.mongoInstances[instance].model.Page.find({})
    pages.forEach((page) => {
      pageBounds[page.name] = page.bounds
    })
    const thingies = await MC.mongoInstances[instance].model.Thingie.find({}).populate({
      path: 'file_ref',
      select: '_id file_ext filename'
    })
    const len = thingies.length
    for (let i = 0; i < len; i++) {
      const thingie = thingies[i]
      if (thingie.thingie_type !== 'text') {
        const upload = thingie.file_ref
        const uploadPath = `${UPLOADS_DIR}/${upload?._id}.${upload?.file_ext}`
        if (!upload || !Fs.existsSync(uploadPath) || !upload.filename) {
          await deleteThingie(thingie._id)
          continue
        }
      }
      const bounds = pageBounds[thingie.location]
      if (!thingie.location || !bounds) {
        await deleteThingie(thingie._id)
      }
      if (
        bounds && (
          thingie.at.x < 0 ||
          thingie.at.x > (bounds.x - thingie.width) ||
          thingie.width > bounds.x ||
          thingie.at.y < 0 ||
          thingie.at.y > (bounds.y - 20)
        )
      ) {
        await MC.mongoInstances[instance].model.Thingie.findOneAndUpdate({ _id: thingie._id }, {
          width: Math.min(thingie.width, bounds.x),
          at: {
            x: Math.max(0, Math.min(thingie.at.x, bounds.x - thingie.width)),
            y: Math.max(0, Math.min(thingie.at.y, bounds.y - 20)),
            z: thingie.at.z
          }
        })
      }
    }
  } catch (e) {
    console.log('==================================== [Scavenger: cleanupCron]')
    console.log(e)
  }
}

// --------------------------------------------------------------- deleteThingie
const deleteThingie = async (thingieId) => {
  try {
    const thingie = await MC.mongoInstances[instance].model.Thingie
      .findById(thingieId)
      .populate({
        path: 'file_ref',
        select: '_id file_ext'
      })
    if (!thingie) {
      throw new Error('File does not exist!')
    }
    if (thingie.file_ref) {
      const upload = thingie.file_ref
      await MC.mongoInstances[instance].model.Upload.deleteOne({ _id: upload._id })
      Fs.unlink(`${UPLOADS_DIR}/${upload._id}.${upload.file_ext}`, (err) => {
        if (err) {
          console.log(err)
        } else {
          console.log(`deleted ${upload._id}.${upload.file_ext}`)
        }
      })
    }
    const deleted = await MC.mongoInstances[instance].model.Thingie.deleteOne({ _id: thingie._id })
    if (deleted) {
      socket.emit(`${instance}|cron|digest-compost-thingie|initialize`, thingie._id)
      console.log(`deleted thingie ${thingie._id}`)
    }
  } catch (e) {
    console.log('================================== [Scavenger: deleteThingie]')
    console.log(e)
  }
}

// ------------------------------------------------------- digestCompostThingies
const digestCompostThingies = async () => {
  try {
    const now = Date.now()
    const twoWeeks = 1000 * 60 * 60 * 24 * 14 // two weeks in milliseconds
    const twoWeeksAgo = new Date(now - twoWeeks)
    const compostThingies = await MC.mongoInstances[instance].model.Thingie.find({
      location: 'compost',
      $or: [
        { compostedAt: { $lt: twoWeeksAgo } },
        { updatedAt: { $lt: twoWeeksAgo } }
      ]
    })
    const len = compostThingies.length
    for (let i = 0; i < len; i++) {
      const thingie = compostThingies[i]
      await deleteThingie(thingie._id)
    }
  } catch (e) {
    console.log('========================== [Scavenger: digestCompostThingies]')
    console.log(e)
  }
}

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------
MC.app.on('mongoose-connected', async () => {
  console.log('🪱 Scavenger started')
  try {
    const mongoInstances = Object.keys(MC.mongoInstances)
    if (!instance) {
      throw new Error('Missing argument: no Mongo instance name provided.')
    }
    if (!mongoInstances.includes(instance)) {
      throw new Error('The provided instance does not exist.')
    }
    await digestCompostThingies()
    await cleanupThingies()
    await cleanupUploads()
    console.log('🪱 Scavenger updates completed')
    socket.disconnect()
    process.exit(0)
  } catch (e) {
    console.log('=========================================== [Cron: Scavenger]')
    console.log(e)
    process.exit(0)
  }
})
