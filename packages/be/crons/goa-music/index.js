/**
 *
 * ⏱️️ [Cron | every 5 minutes]
 * GOA scans through the pages database and
 * accesses/changes page states as well as
 * thingie propensities to leave a leaking page.
 *
 */
console.log('🔱 [cron] GOA')

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
// require('@Module_Upload')
// require('@Module_Portal')

const { GenerateWebsocketClient } = require(`${MC.packageRoot}/modules/utilities`)

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------
MC.app = Express()

const socket = GenerateWebsocketClient(instance)

// ===================================================================== connect
socket.on('connect', () => { socket.emit('join-room', `${instance}|cron|websocket`) })

// /////////////////////////////////////////////////////////////////// Functions
// ------------------------------------------------------- ThingiePreaccelerator
const thingiePreaccelerator = async () => {
  try {
    const pages = await MC.mongoInstances[instance].model.Page.find({
      name: { $nin: Rules[instance].goa.ignore_list }
    })
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const thingies = await MC.mongoInstances[instance].model.Thingie.find({ location: page.name })
      if (thingies.length) {
        const points = thingies.map((thingie) => {
          return {
            x: thingie.at.x,
            y: thingie.at.y,
            m: thingie.width
          }
        })
        const massPositionsX = points.reduce((collector, point) => collector + point.x * point.m, 0)
        const massPositionsY = points.reduce((collector, point) => collector + point.y * point.m, 0)
        const massSum = points.reduce((collector, point) => collector + point.m, 0)
        const centerOfMassX = massPositionsX / massSum
        const centerOfMassY = massPositionsY / massSum
        const pageCenterOfMass = [centerOfMassX, centerOfMassY]
        const thingieData = thingies.map((thingie) => {
          const position = [thingie.at.x + thingie.width / 2, thingie.at.y]
          const deltaX = position[0] - pageCenterOfMass[0]
          const deltaY = position[1] - pageCenterOfMass[1]
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
          return {
            thingie_id: thingie._id,
            movement: thingie.update_count ? thingie.update_count : 0,
            weight: 250 * Math.log(thingie.width / 30 + 1),
            distance
          }
        })
        const minMovement = Math.min(...thingieData.map(data => data.movement))
        const preaccelerations = thingieData.map((data) => {
          const preacceleration = (data.movement - minMovement) * data.distance / data.weight
          return {
            updateOne: {
              filter: { _id: data.thingie_id },
              update: { preacceleration }
            }
          }
        })
        await MC.mongoInstances[instance].model.Thingie.bulkWrite(preaccelerations)
      }
    }
  } catch (e) {
    console.log('========= [Function: GodessOfAnarchy - thingiePreaccelerator]')
    console.log(e)
  }
}

// ///////////////////////////////////////////////////////////////////////// GOA
// -----------------------------------------------------------------------------
const pagePreaccelerator = async () => {
  try {
    const pages = await MC.mongoInstances[instance].model.Page.find({
      name: { $nin: Rules[instance].goa.ignore_list }
    })
    const thingies = await MC.mongoInstances[instance].model.Thingie.find({}).populate({
      path: 'file_ref',
      select: 'filename file_ext filesize'
    })
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      let totalBytes = 0
      const pageThingies = thingies.filter(thingie => thingie.location === page.name)
      pageThingies.forEach((thingie) => {
        if (thingie.file_ref) {
          totalBytes += thingie.file_ref.filesize
        }
      })
      const saturated = totalBytes > 40000000 || pageThingies.length > 40
      if (saturated && page.state === 'clumping') { // change page state to metastable
        const updated = await MC.mongoInstances[instance].model.Page
          .findOneAndUpdate({ _id: page._id }, { state: 'metastable' }, { new: true })
          .populate({
            path: 'portal_refs',
            populate: { path: 'thingie_ref', select: 'colors' }
          })
        socket.emit(`${instance}|cron|page-state-update|initialize`, updated)
      } else if (totalBytes <= 36000000 && pageThingies.length <= 36 && page.state === 'leaking') { // change page state to clumping
        const updated = await MC.mongoInstances[instance].model.Page
          .findOneAndUpdate({ _id: page._id }, { state: 'clumping' }, { new: true })
          .populate({
            path: 'portal_refs',
            populate: { path: 'thingie_ref', select: 'colors' }
          })
        socket.emit(`${instance}|cron|page-state-update|initialize`, updated)
      }
    }
  } catch (e) {
    console.log('============================= [Function: pagePreaccelerator]')
    console.log(e)
  }
}

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------
MC.app.on('mongoose-connected', async () => {
  console.log('🔱 Godess Of Anarchy started')
  try {
    const mongoInstances = Object.keys(MC.mongoInstances)
    if (!instance) {
      throw new Error('Missing argument: no Mongo instance name provided.')
    }
    if (!mongoInstances.includes(instance)) {
      throw new Error('The provided instance does not exist.')
    }
    await pagePreaccelerator()
    await thingiePreaccelerator()
    socket.disconnect()
    console.log('🔱 GOA updates completed')
    process.exit(0)
  } catch (e) {
    console.log('===================================== [Cron: GodessOfAnarchy]')
    console.log(e)
    process.exit(0)
  }
})
