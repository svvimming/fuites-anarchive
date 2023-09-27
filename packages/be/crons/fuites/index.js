/**
 *
 * ⏱️️ [Cron | every day]
 * fuites thingie migratormoves thingies from leaking pages to
 * new pages based on their preacceleration
 *
 */
console.log('💧 [cron] fuites')

// ///////////////////////////////////////////////////// Imports + general setup
// -----------------------------------------------------------------------------
const ModuleAlias = require('module-alias')
const Path = require('path')
const Fs = require('fs-extra')
const Express = require('express')
const Rules = require('../rules.json')
const argv = require('minimist')(process.argv.slice(2))
const instance = argv.instance
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
// require('@Module_Thingie')
// require('@Module_Page')
// require('@Module_Portal')

const { GenerateWebsocketClient } = require(`${MC.packageRoot}/modules/utilities`)

// ////////////////////////////////////////////////////////////////// Initialize
MC.app = Express()

const socket = GenerateWebsocketClient(instance)

// ===================================================================== connect
socket.on('connect', () => { socket.emit('join-room', `${instance}|cron|websocket`) })

// /////////////////////////////////////////////////////////////////// Functions
// ------------------------------------------------------------- thingieMigrator
const thingieMigrator = async () => {
  try {
    const leaking = await MC.mongoInstances[instance].model.Page
      .find({
        state: 'leaking',
        name: { $nin: Rules[instance].fuites.prevent_leak_list }
      })
      .populate({
        path: 'portal_refs',
        populate: { path: 'thingie_ref' }
      })
    if (leaking.length) {
      const migrations = []
      const preventDepositList = Rules[instance].fuites.prevent_deposit_list
      for (let i = 0; i < leaking.length; i++) {
        const page = leaking[i]
        const thingies = await MC.mongoInstances[instance].model.Thingie
          .find({ location: page.name })
          .sort({ preacceleration: 'desc' })
        const now = Date.now()
        const gracePeriod = Rules[instance].fuites.milliseconds_since_updated_grace_period || 1000 * 60 * 60 * 24 // one day in milliseconds
        const recentlyUpdated = thingies.some((thingie) => {
          const lastUpdated = new Date(thingie.updatedAt)
          return lastUpdated.getTime() > now - gracePeriod
        })
        if (thingies.length && !recentlyUpdated) {
          const overflow = await MC.mongoInstances[instance].model.Page.findOne({ overflow_page: page.name })
          let newPageLocation = ''
          if (overflow && !preventDepositList.includes(overflow.name)) {
            newPageLocation = overflow.name
          } else if (page.portal_refs.length) {
            const connection = page.portal_refs.find((portal) => {
              return portal.edge.split('_').find(name => name !== page.name && !preventDepositList.includes(name))
            })
            if (connection) {
              newPageLocation = connection.edge.split('_').find(name => name !== page.name && !preventDepositList.includes(name))
            }
          }
          if (newPageLocation) {
            const firstThingie = thingies[0]
            migrations.push({
              _id: firstThingie._id,
              new_location: {
                location: newPageLocation,
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
        console.log('fuites migrations:', migrations)
        for (let j = 0; j < migrations.length; j++) {
          const migration = migrations[j]
          const thingie = await MC.mongoInstances[instance].model.Thingie.findOneAndUpdate({ _id: migration._id }, {
            location: migration.new_location.location,
            last_update_token: 'fuites',
            update_count: 0,
            $push: { last_locations: migration.new_location }
          }, { new: true })
          socket.emit(`${instance}|cron|migrate-thingie|initialize`, thingie)
        }
      }
    }
  } catch (e) {
    console.log('===================== [Function: fuites - thingieMigrator]')
    console.log(e)
  }
}

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------
MC.app.on('mongoose-connected', async () => {
  console.log('💧fuites migrations started')
  try {
    const mongoInstances = Object.keys(MC.mongoInstances)
    if (!instance) {
      throw new Error('Missing argument: no Mongo instance name provided.')
    }
    if (!mongoInstances.includes(instance)) {
      throw new Error('The provided instance does not exist.')
    }
    await thingieMigrator()
    socket.disconnect()
    console.log('💧fuites migrations finished')
    process.exit(0)
  } catch (e) {
    console.log('=========================================== [Cron: fuites]')
    console.log(e)
    process.exit(0)
  }
})
