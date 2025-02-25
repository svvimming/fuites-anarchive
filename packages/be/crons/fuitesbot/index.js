/**
 *
 * ⏱️️ [Cron | every day]
 * fuitesbot thingie migrator moves thingies from leaking pages to
 * new pages based on their preacceleration
 *
 */
console.log('💧 [cron] fuitesbot')

// ///////////////////////////////////////////////////// Imports + general setup
// -----------------------------------------------------------------------------
const ModuleAlias = require('module-alias')
const Path = require('path')
const Fs = require('fs-extra')
const Express = require('express')
require('dotenv').config({ path: Path.resolve(__dirname, '../../.env') })

const MC = require('../../config')

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
require('@Module_Page')
require('@Module_Verse')

const { GenerateWebsocketClient } = require(`${MC.packageRoot}/modules/utilities`)

// ////////////////////////////////////////////////////////////////// Initialize
MC.app = Express()

const socket = GenerateWebsocketClient()

// ===================================================================== connect
socket.on('connect', () => { socket.emit('join-room', 'cron|websocket') })

// /////////////////////////////////////////////////////////////////// Functions
// -----------------------------------------------------------------------------
/**
 * @method thingieVerseMigrator
 * @param {Object} verse 
 */

const thingieVerseMigrator = async verse => {
  try {
    const settings = verse.settings.fuitesbot
    // Get all leaking pages in this Verse
    const leakingPages = await MC.model.Page.find({
      verse: verse.name,
      state: 'leaking',
      name: { $nin: ['compost', 'pocket'] }
    })
    // Loop through all leaking pages in this Verse
    if (leakingPages.length) {
      const migrations = []
      const len = leakingPages.length
      for (let i = 0; i < len; i++) {
        const page = leakingPages[i]
        // Get the thingie on this page with the highest preacceleration and not within the grace period
        const thingie = await MC.model.Thingie.findOne({
          verse: verse.name,
          location: page.name,
          'last_update.timestamp': { $lt: Date.now() - settings.gracePeriodMs }
        }).sort({ preacceleration: 'desc' })
        // If a thingie is found and there is an overflow page, create update to location
        if (thingie && page.overflow_page) {
          // Add update to migrations array
          migrations.push({
            _id: thingie._id,
            last_update: { timestamp: Date.now(), token: 'fuitesbot' },
            update_count: 0,
            location: page.overflow_page,
            $push: {
              location_history: {
                location: page.overflow_page,
                at: { x: thingie.at.x, y: thingie.at.y }
              }
            }
          })
        }
      }
      // If there are migrations to be made update thingies in the db and broadcast to the socket
      if (migrations.length) {
        for (let j = 0; j < migrations.length; j++) {
          const migration = migrations[j]
          const thingie = await MC.model.Thingie.findOneAndUpdate({ _id: migration._id }, migration, { new: true })
          socket.emit('cron|migrate-thingie|initialize', thingie)
          console.log(`fuitesbot moved thingie ${thingie._id} to page ${thingie.location} in verse ${thingie.verse}.`)
        }
      }
    }
  } catch (e) {
    console.log('================ [function: fuitesbot - thingieVerseMigrator]')
    console.log(e)
  }
}

/**
 * @method verseLeaks
 */

const verseLeaks = async () => {
  try {
    const verses = await MC.model.Verse.find({})
    const len = verses.length
    for (let i = 0; i < len; i++) {
      await thingieVerseMigrator(verses[i])
    }
  } catch (e) {
    console.log('========================== [function: fuitesbot - verseLeaks]')
    console.log(e)
  }
}

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------
MC.app.on('mongoose-connected', async () => {
  console.log('💧 fuitesbot migrations started')
  try {
    await verseLeaks()
    socket.disconnect()
    console.log('💧 fuitesbot migrations finished')
    process.exit(0)
  } catch (e) {
    console.log('=========================================== [Cron: fuitesbot]')
    console.log(e)
    process.exit(0)
  }
})
