/**
 *
 * ⏱️️ [Cron | every minute] Tunneler creates portals between past thingie locations
 *
 */
console.log('🚇 [cron] Tunneler')

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
// -----------------------------------------------------------------------------
MC.app = Express()

const socket = GenerateWebsocketClient(instance)

// ===================================================================== connect
socket.on('connect', () => { socket.emit('join-room', `${instance}|cron|websocket`) })

// /////////////////////////////////////////////////////////////////// Functions
// ------------------------------------------------------------- createNewPortal
const createNewPortal = async (thingieId, portalName, vertices) => {
  try {
    for (let i = 0; i < vertices.length; i++) {
      const vertex = vertices[i]
      if (!vertex.hasOwnProperty('at')) {
        const thingie = await MC.mongoInstances[instance].model.Thingie.findById(thingieId)
        vertex.at = {
          x: thingie.at.x + (Math.floor(Math.random() * thingie.width)),
          y: thingie.at.y + (Math.floor(Math.random() * 20))
        }
      }
    }
    const created = await MC.mongoInstances[instance].model.Portal.create({
      thingie_ref: thingieId,
      edge: portalName,
      vertices: { a: vertices[0], b: vertices[1] }
    })
    if (created) {
      console.log(`New portal opened between ${created.edge.replace('_', ' and ')}.`)
      for (let i = 0; i < vertices.length; i++) {
        const updated = await MC.mongoInstances[instance].model.Page.findOneAndUpdate(
          { name: vertices[i].location },
          { $push: { portal_refs: created._id } },
          { new: true }
        ).populate({
          path: 'portal_refs',
          populate: { path: 'thingie_ref', select: 'colors' }
        })
        if (updated) {
          socket.emit(`${instance}|cron|page-portals-changed|initialize`, updated)
        }
      }
    }
  } catch (e) {
    console.log('================================= [Function: createNewPortal]')
    console.log(e)
  }
}

// ----------------------------------------------------------------- closePortal
const closePortal = async (incoming) => {
  try {
    const portal = await MC.mongoInstances[instance].model.Portal.findById(incoming._id)
    const vertices = [portal.vertices.a, portal.vertices.b]
    for (let i = 0; i < vertices.length; i++) {
      const updated = await MC.mongoInstances[instance].model.Page.findOneAndUpdate(
        { name: vertices[i].location },
        { $pull: { portal_refs: portal._id } },
        { new: true }
      ).populate({
        path: 'portal_refs',
        populate: { path: 'thingie_ref', select: 'colors' }
      })
      socket.emit(`${instance}|cron|page-portals-changed|initialize`, updated)
    }
    const closed = await MC.mongoInstances[instance].model.Portal.deleteOne({ id: portal._id })
    console.log(`Portal closed: ${closed}`)
  } catch (e) {
    console.log('===================================== [Function: closePortal]')
    console.log(e)
  }
}

// ---------------------------------------------------- checkPortalThingiesExist
const checkPortalThingiesExist = async () => {
  try {
    const allPortals = await MC.mongoInstances[instance].model.Portal.find({})
    const portalsMissingThingies = []
    for (let i = 0; i < allPortals.length; i++) {
      const hasThingieRef = await MC.mongoInstances[instance].model.Thingie.exists({ _id: allPortals[i].thingie_ref })
      if (!hasThingieRef) {
        portalsMissingThingies.push(allPortals[i]._id)
      }
    }
    for (let j = 0; j < portalsMissingThingies.length; j++) {
      await closePortal(portalsMissingThingies[j])
    }
  } catch (e) {
    console.log('======================== [Function: checkPortalThingiesExist]')
    console.log(e)
  }
}

// -------------------------------------------------- updatePortalsBetweenPages
const updatePortalsBetweenPages = async () => {
  try {
    await checkPortalThingiesExist()
    const thingies = await MC.mongoInstances[instance].model.Thingie.find({})
    const preventConnections = Rules[instance]?.tunneler?.prevent_connection_list || []
    const maxLinks = Rules[instance]?.tunneler?.max_portal_chain_length || 3
    for (let i = 0; i < thingies.length; i++) {
      const thingie = thingies[i]
      const locations = [...thingie.last_locations].reverse()
      const portals = await MC.mongoInstances[instance].model.Portal
        .find({ thingie_ref: thingie._id })
        .sort({ createdAt: 'desc' })
      if (locations.length > 1) {
        const len = Math.min(locations.length - 1, maxLinks)
        for (let j = 0; j < len; j++) {
          const vA = locations[j]
          const vB = locations[j + 1]
          if (vA.location !== vB.location) {
            const portalName = `${vA.location}_${vB.location}`
            const portalExists = portals.some(portal => portal.edge === portalName)
            const notOnPreventList = !preventConnections.includes(vA.location) && !preventConnections.includes(vB.location)
            if (!portalExists && notOnPreventList) {
              await createNewPortal(thingie._id, portalName, [vA, vB])
            }
          }
        }
      }
      if (portals.length > maxLinks) {
        const outdatedPortals = portals.slice(maxLinks)
        for (let k = 0; k < outdatedPortals.length; k++) {
          await closePortal(outdatedPortals[k]._id)
        }
      }
    }
  } catch (e) {
    console.log('====================== [Function: updatePortalsBetweenPages]')
    console.log(e)
  }
}

// //////////////////////////////////////////////////////////// SetActivePortals
const setActivePortals = async () => {
  try {
    const pages = await MC.mongoInstances[instance].model.Page.find({}).populate({
      path: 'portal_refs',
      populate: { path: 'thingie_ref' }
    })
    const len = pages.length
    for (let i = 0; i < len; i++) {
      const page = pages[i]
      const connections = page.portal_refs.map(ref => ref.edge.split('_').filter(name => name !== page.name))

      if (page.portal_refs.length) {
        const slugs = [...new Set(connections.flat())]
        for (let j = 0; j < slugs.length; j++) {
          const slug = slugs[j]
          const refs = page.portal_refs.filter(ref => ref.edge.includes(slug))
          const lowestP = refs.reduce((min, portal) => min.thingie_ref.preacceleration < portal.thingie_ref.preacceleration ? min : portal)
          const enabled = refs.filter((portal) => portal.enabled)
          for (let k = 0; k < enabled.length; k++) {
            await MC.mongoInstances[instance].model.Portal.findOneAndUpdate({ _id: enabled[k]._id }, { enabled: false })
          }
          await MC.mongoInstances[instance].model.Portal.findOneAndUpdate({ _id: lowestP._id }, { enabled: true })
        }
        // for (let i = 0; i < enabled.length; i++) {
        //   await MC.mongoInstances[instance].model.Portal.findOneAndUpdate({ _id: enabled[i]._id }, { enabled: false })
        // }
        // await MC.mongoInstances[instance].model.Portal.findOneAndUpdate({ _id: lowestP._id }, { enabled: true })
      }
    }
  } catch (e) {
    console.log('==================================== [Cron: setActivePortals]')
    console.log(e)
  }
}

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------
MC.app.on('mongoose-connected', async () => {
  console.log('🚇 Tunneler started')
  try {
    const mongoInstances = Object.keys(MC.mongoInstances)
    if (!instance) {
      throw new Error('Missing argument: no Mongo instance name provided.')
    }
    if (!mongoInstances.includes(instance)) {
      throw new Error('The provided instance does not exist.')
    }
    await updatePortalsBetweenPages()
    await setActivePortals()
    console.log('🚇 Tunneler updates completed')
    socket.disconnect()
    process.exit(0)
  } catch (e) {
    console.log('============================================ [Cron: Tunneler]')
    console.log(e)
    process.exit(0)
  }
})
