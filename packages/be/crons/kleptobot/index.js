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
        const thingies = await MC.model.Thingie.find({ location: spaze.name }).sort({ preacceleration: 'desc' })
        if (thingies.length) {
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
            migrations.push({
              _id: thingies[0]._id,
              location: newSpazeLocation,
              last_update_token: 'kleptobot',
              record_new_location: true
            })
          }
        }
      }
      if (migrations.length) {
        for (let j = 0; j < migrations.length; j++) {
          socket.emit('cron|migrate-thingie|initialize', migrations[j])
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
