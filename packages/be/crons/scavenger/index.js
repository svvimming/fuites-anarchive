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
const instance = argv.mongoinstance
require('dotenv').config({ path: Path.resolve(__dirname, '../../.env') })

const MC = require('../../config')

const UPLOADS_DIR = Path.resolve(`${MC.publicRoot}/uploads`)

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
require('@Module_Thingie')
require('@Module_Upload')

const { GenerateWebsocketClient } = require(`${MC.packageRoot}/modules/utilities`)

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------
MC.app = Express()

const socket = GenerateWebsocketClient()

// ===================================================================== connect
socket.on('connect', () => { socket.emit('join-room', `${instance}|cron|websocket`) })

// /////////////////////////////////////////////////////////////////// Functions
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
      console.log(thingie)
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
    if (!instance) {
      throw new Error('Missing argument: no Mongo instance name provided.')
    }
    await digestCompostThingies()
    console.log('🪱 Scavenger updates completed')
    socket.disconnect()
    process.exit(0)
  } catch (e) {
    console.log('=========================================== [Cron: Scavenger]')
    console.log(e)
    process.exit(0)
  }
})
