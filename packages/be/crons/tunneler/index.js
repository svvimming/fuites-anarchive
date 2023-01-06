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
// -----------------------------------------------------------------------------
MC.app = Express()

const socket = GenerateWebsocketClient()

// ===================================================================== connect
socket.on('connect', () => { socket.emit('join-room', 'cron|websocket') })

// /////////////////////////////////////////////////////////////////// Functions
// ------------------------------------------------------------- createNewPortal
const createNewPortal = async (thingieId, portalName, vertices) => {
  try {
    for (let i = 0; i < vertices.length; i++) {
      const vertex = vertices[i]
      if (!vertex.hasOwnProperty('at')) {
        const thingie = await MC.model.Thingie.findById(thingieId)
        vertex.at = {
          x: thingie.at.x + (Math.floor(Math.random() * thingie.width)),
          y: thingie.at.y + (Math.floor(Math.random() * 20))
        }
      }
    }
    const created = await MC.model.Portal.create({
      thingie_ref: thingieId,
      edge: portalName,
      vertices: { a: vertices[0], b: vertices[1] }
    })
    if (created) {
      console.log(`New portal opened between ${created.edge.replace('_', ' and ')}.`)
      for (let i = 0; i < vertices.length; i++) {
        const updated = await MC.model.Spaze.findOneAndUpdate(
          { name: vertices[i].location },
          { $push: { portal_refs: created._id } },
          { new: true }
        ).populate({
          path: 'portal_refs',
          populate: { path: 'thingie_ref', select: 'colors' }
        })
        if (updated) {
          socket.emit('cron|spaze-portals-changed|initialize', updated)
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
    const portal = await MC.model.Portal.findById(incoming._id)
    const vertices = [portal.vertices.a, portal.vertices.b]
    for (let i = 0; i < vertices.length; i++) {
      const updated = await MC.model.Spaze.findOneAndUpdate(
        { name: vertices[i].location },
        { $pull: { portal_refs: portal._id } },
        { new: true }
      ).populate({
        path: 'portal_refs',
        populate: { path: 'thingie_ref', select: 'colors' }
      })
      socket.emit('cron|spaze-portals-changed|initialize', updated)
    }
    const closed = await MC.model.Portal.deleteOne({ id: portal._id })
    console.log(`Portal closed: ${closed}`)
  } catch (e) {
    console.log('===================================== [Function: closePortal]')
    console.log(e)
  }
}

// ---------------------------------------------------- checkPortalThingiesExist
const checkPortalThingiesExist = async () => {
  try {
    const allPortals = await MC.model.Portal.find({})
    const portalsMissingThingies = []
    for (let i = 0; i < allPortals.length; i++) {
      const hasThingieRef = await MC.model.Thingie.exists({ _id: allPortals[i].thingie_ref })
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

// -------------------------------------------------- updatePortalsBetweenSpazes
const updatePortalsBetweenSpazes = async () => {
  try {
    await checkPortalThingiesExist()
    const thingies = await MC.model.Thingie.find({})
    for (let i = 0; i < thingies.length; i++) {
      const thingie = thingies[i]
      const locations = [...thingie.last_locations].reverse()
      const portals = await MC.model.Portal
        .find({ thingie_ref: thingie._id })
        .sort({ createdAt: 'desc' })
      if (locations.length > 1) {
        for (let j = 0; j < locations.length - 1; j++) {
          const vA = locations[j]
          const vB = locations[j + 1]
          const portalName = `${vA.location}_${vB.location}`
          const portalExists = portals.some(portal => portal.edge === portalName)
          const notPocketOrCompost = vA.location !== 'pocket' && vB.location !== 'pocket' && vA.location !== 'compost' && vB.location !== 'compost'
          if (!portalExists && notPocketOrCompost) {
            createNewPortal(thingie._id, portalName, [vA, vB])
          }
        }
      }
      if (portals.length > (locations.length - 1)) {
        const outdatedPortals = portals.slice(locations.length - 1)
        for (let k = 0; k < outdatedPortals.length; k++) {
          closePortal(outdatedPortals[k]._id)
        }
      }
    }
  } catch (e) {
    console.log('====================== [Function: updatePortalsBetweenSpazes]')
    console.log(e)
  }
}

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------
MC.app.on('mongoose-connected', async () => {
  console.log('🚇 Tunneler started')
  try {
    await updatePortalsBetweenSpazes()
    console.log('🚇 Tunneler updates completed')
    socket.disconnect()
    process.exit(0)
  } catch (e) {
    console.log('===================================== [Cron: GodessOfAnarchy]')
    console.log(e)
    process.exit(0)
  }
})
