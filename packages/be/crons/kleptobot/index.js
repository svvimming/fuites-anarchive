/**
 *
 * ⏱️️ [Cron | every day]
 * Kleptobot moves thingies from leaking spaces to
 * new spazes based on their preacceleration
 *
 */
console.log('🤖️ [cron] Kleptobot')

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
require('@Module_Spaze')
require('@Module_Portal')

const { GenerateWebsocketClient } = require(`${MC.packageRoot}/modules/utilities`)

// ////////////////////////////////////////////////////////////////// Initialize
MC.app = Express()

const socket = GenerateWebsocketClient()

// ===================================================================== connect
socket.on('connect', () => { socket.emit('join-room', 'cron|websocket') })

// /////////////////////////////////////////////////////////////////// Functions
// ------------------------------------------------------------- thingieMigrator
const thingieMigrator = async () => {
  try {
    const leaking = await MC.model.Spaze
      .find({ state: 'leaking' })
      .populate({
        path: 'portal_refs',
        populate: { path: 'thingie_ref' }
      })
    if (leaking.length) {
      const migrations = []
      for (let i = 0; i < leaking.length; i++) {
        const spaze = leaking[i]
        const thingies = await MC.model.Thingie
          .find({ location: spaze.name })
          .sort({ preacceleration: 'desc' })
        const now = Date.now()
        const day = 1000 * 60 * 60 * 24 // one day in milliseconds
        const oneDayAgo = new Date(now - day)
        const recentlyUpdated = await MC.model.Thingie.exists({ location: spaze.name, updatedAt: { $lt: oneDayAgo } })
        if (thingies.length && !recentlyUpdated) {
          const overflow = await MC.model.Spaze.findOne({ overflow_spaze: spaze.name })
          let newSpazeLocation = ''
          if (overflow) {
            newSpazeLocation = overflow.name
          } else if (spaze.portal_refs.length) {
            const portal = spaze.portal_refs[0]
            const connection = portal.edge.split('_').find(name => name !== spaze.name)
            if (connection) {
              newSpazeLocation = connection
            }
          }
          if (newSpazeLocation) {
            const firstThingie = thingies[0]
            migrations.push({
              _id: firstThingie._id,
              location: newSpazeLocation,
              last_location: {
                location: newSpazeLocation,
                at: {
                  x: firstThingie.at.x,
                  y: firstThingie.at.y
                }
              }
            })
          }
        }
      }
      if (migrations.length) {
        for (let j = 0; j < migrations.length; j++) {
          const migration = migrations[j]
          const thingie = await MC.model.Thingie.findOneAndUpdate({ _id: migration._id }, {
            location: migration.location,
            last_update_token: 'kleptobot',
            update_count: 0,
            $push: { last_locations: migration.last_location }
          }, { new: true })
          socket.emit('cron|migrate-thingie|initialize', thingie)
        }
      }
    }
  } catch (e) {
    console.log('===================== [Function: Kleptobot - thingieMigrator]')
    console.log(e)
  }
}

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------
MC.app.on('mongoose-connected', async () => {
  console.log('🤖️ Kleptobot started')
  try {
    await thingieMigrator()
    socket.disconnect()
    console.log('🤖️ Kleptobot finished')
    process.exit(0)
  } catch (e) {
    console.log('=========================================== [Cron: Kleptobot]')
    console.log(e)
    process.exit(0)
  }
})
