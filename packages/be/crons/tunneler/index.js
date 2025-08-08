/**
 *
 * ⏱️️ [Cron | every 2 minutes] Tunneler creates portals between past thingie locations
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
require('@Module_Page')
require('@Module_Portal')
require('@Module_Verse')

const { GenerateWebsocketClient } = require(`${MC.packageRoot}/modules/utilities`)

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------
MC.app = Express()

const socket = GenerateWebsocketClient()

// ===================================================================== connect
socket.on('connect', () => { socket.emit('join-room', 'cron|websocket') })

// /////////////////////////////////////////////////////////////////// Functions
/**
 * @method checkAllPortalThingiesExist
 */

const checkAllPortalThingiesExist = async () => {
  try {
    // Loop through all Portals irrespective of Verse
    const allPortals = await MC.model.Portal.find({})
    for (let i = 0; i < allPortals.length; i++) {
      const portal = allPortals[i]
      const hasThingieRef = await MC.model.Thingie.exists({ _id: portal.thingie_ref })
      // If Portal references a Thingie that no longer exists, delete it
      if (!hasThingieRef) {
        await closePortal(portal)
      }
    }
  } catch (e) {
    console.log('===================== [Function: checkAllPortalThingiesExist]')
    console.log(e)
  }
}

/**
 * @method closePortal
 */

const closePortal = async portal => {
  try {
    const vertices = portal.vertices
    for (let i = 0; i < vertices.length; i++) {
      // Remove the portal ref from both connected Pages
      const updated = await MC.model.Page.findOneAndUpdate(
        { verse: portal.verse, name: vertices[i].location },
        { $pull: { portal_refs: portal._id } },
        { new: true }
      ).populate({
        path: 'portal_refs',
        populate: { path: 'thingie_ref', select: 'colors' }
      })
      // Broadcast updated Pages to the socket
      socket.emit('cron|page-portals-changed|initialize', updated)
    }
    // Delete this Portal
    const closed = await MC.model.Portal.deleteOne({ id: portal._id })
    console.log(`Portal closed: ${closed}`)
  } catch (e) {
    console.log('===================================== [function: closePortal]')
    console.log(e)
  }
}

/**
 * @method createNewPortal
 * @param {Object} verse
 * @param {Object} thingie
 * @param {Array} vertices
 */

const createNewPortal = async (verse, thingie, vertices) => {
  try {
    // Create the new Portal document
    const created = await MC.model.Portal.create({
      verse: verse.name,
      verse_ref: verse._id,
      thingie_ref: thingie._id,
      vertices
    })
    if (created) {
      // Console log the new connection
      console.log(`New portal opened between ${vertices[0].location} and ${vertices[1].location}.`)
      // Update the two Pages connected by the new Portal with portal refs.
      for (let i = 0; i < created.vertices.length; i++) {
        const updated = await MC.model.Page.findOneAndUpdate(
          {
            name: created.vertices[i].location,
            verse: verse.name
          },
          { $push: { portal_refs: created._id } },
          { new: true }
        ).populate({
          path: 'portal_refs',
          populate: { path: 'thingie_ref', select: 'colors' }
        })
        // Add page refs to each vertex
        created.vertices[i].page_ref = updated._id
        // Broadcast the updated page to the socket
        socket.emit('cron|page-portals-changed|initialize', updated)
      }
      // Save the Portal with updated vertex page refs
      await created.save()
    }
    // Now that a new Portal is associated with this Thingie, fetch them and
    // make sure there aren't more than the max chain limit for this Verse
    const maxLinks = verse.settings.tunneler.portalChainLength
    const portals = await MC.model.Portal.find({ thingie_ref: thingie._id }).sort({ createdAt: 'desc' })
    if (portals.length > maxLinks) {
      const outdatedPortals = portals.slice(maxLinks)
      for (let i = 0; i < outdatedPortals.length; i++) {
        await closePortal(outdatedPortals[i])
      }
    }
  } catch (e) {
    console.log('================================= [Function: createNewPortal]')
    console.log(e)
  }
}

/**
 * @method updatePortalsBetweenPages
 * @param {Object} verse
 */

const updatePortalsBetweenPages = async verse => {
  try {
    // Get all Thingies in this Verse
    const thingies = await MC.model.Thingie.find({ verse: verse.name })
    const len = thingies.length
    const maxLinks = verse.settings.tunneler.portalChainLength
    // Loop through Thingies
    for (let i = 0; i < len; i++) {
      const thingie = thingies[i]
      // Get thingie location history without the Pocket and Compost
      // Reverse the array to start with the most recent
      const locationHistory = thingie.location_history.filter(item => item.location !== 'pocket' && item.location !== 'compost').reverse()
      const entries = locationHistory.length
      // Loop through the locations
      const locationObjects = []
      const locations = []
      // Add only one unique record for each location to the locationObjects array
      // Break the loop if the number of location objects is 1 greater than the Verse portal chain length
      for (let j = 0; j < entries; j++) {
        const item = locationHistory[j]
        if (!locations.includes(item.location)) {
          locationObjects.push(item)
          locations.push(item.location)
        }
        if (locationObjects.length > maxLinks) { break }
      }
      // Get all Portals associated with this Thingie
      const portals = await MC.model.Portal.find({ thingie_ref: thingie._id }).sort({ createdAt: 'desc' })
      // Loop through locationObjects and determine if a portal associated with
      // this Thingie already exists between the two locations
      if (locationObjects.length > 1) {
        for (let k = 0; k < locationObjects.length - 1; k++) {
          const a = locationObjects[k]
          const b = locationObjects[k + 1]
          const connectionAlreadyExists = portals.find(portal => {
            const vertices = portal.vertices.map(vertex => vertex.location)
            return vertices.includes(a.location) && vertices.includes(b.location)
          })
          // If there is no existing portal that meets the criteria, create one
          if (!connectionAlreadyExists) {
            await createNewPortal(verse, thingie, [a, b])
          }
        }
      }
    }
  } catch (e) {
    console.log('====================== [Function: updatePortalsBetweenPages]')
    console.log(e)
  }
}

/**
 * @method updateVersePortals
 */

const updateVersePortals = async () => {
  try {
    // First check to see if each portal's thingie-ref thingie exists,
    // if not, close the portal. This operates globally independent of Verse.
    await checkAllPortalThingiesExist()
    // Next, loop through all Verses and update portals within each Verse.
    const verses = await MC.model.Verse.find({})
    const len = verses.length
    for (let i = 0; i < len; i++) {
      await updatePortalsBetweenPages(verses[i])
    }
  } catch (e) {
    console.log('============================== [function: updateVersePortals]')
    console.log(e)
  }
}

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------
MC.app.on('mongoose-connected', async () => {
  console.log('🚇 Tunneler started')
  try {
    await updateVersePortals()
    // await setActivePortals()
    console.log('🚇 Tunneler updates completed')
    socket.disconnect()
    process.exit(0)
  } catch (e) {
    console.log('============================================ [Cron: Tunneler]')
    console.log(e)
    process.exit(0)
  }
})
