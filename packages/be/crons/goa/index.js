/**
 *
 * ⏱️️ [Cron | ]
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
require('@Module_Upload')
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
// -----------------------------------------------------------------------------
/**
 * @method updatePageThingiePreaccelerations
 * @param {[Object]} thingies
 * @param {[Number, Number]} pageCenterOfMass
 * @param {Number} updateCountFloor
 */

const updatePageThingiePreaccelerations = async (thingies, pageCenterOfMass, updateCountFloor) => {
  try {
    const preaccelerations = thingies.map((thingie) => {
      const deltaX = thingie.at.x - pageCenterOfMass[0]
      const deltaY = thingie.at.y - pageCenterOfMass[1]
      const updateCount = thingie.update_count || 0
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const weight = 250 * Math.log(((thingie.at.width * thingie.at.height) / 300) + 1)
      const preacceleration = (updateCount - updateCountFloor) * distance / weight
      return {
        updateOne: {
          filter: { _id: thingie._id },
          update: { preacceleration }
        }
      }
    })
    await MC.model.Thingie.bulkWrite(preaccelerations)
  } catch (e) {
    console.log('========= [Function: GOA - updatePageThingiePreaccelerations]')
    console.log(e)
  }
}

/**
 * @method getPageCenterOfMass
 * @desc Returns a 2D array of (x, y) coordinates of the page's center of mass
 * @param {[Object]} thingies
 * @returns {[Number, Number]}
 */

const getPageCenterOfMass = thingies => {
  const points = thingies.map((thingie) => ({
    x: thingie.at.x,
    y: thingie.at.y,
    m: thingie.at.width * thingie.at.height
  }))
  const massPositionsX = points.reduce((collector, point) => collector + point.x * point.m, 0)
  const massPositionsY = points.reduce((collector, point) => collector + point.y * point.m, 0)
  const sum = points.reduce((collector, point) => collector + point.m, 0)
  return [massPositionsX / sum, massPositionsY / sum]
}

/**
 * @method pagePreaccelerator
 * @param {Object} verse
 */

const pagePreaccelerator = async verse => {
  try {
    // Get all pages in this verse
    const pages = await MC.model.Page.find({ verse: verse.name })
    const len = pages.length
    // Loop through each page
    for (let i = 0; i < len; i++) {
      const page = pages[i]
      let pageBytes = 0
      // Get all the thingies on this page
      const pageThingies = await MC.model.Thingie
        .find({ verse: verse.name, location: page.name })
        .populate({ path: 'file_ref', select: 'filename file_ext filesize' })
      // Get data to calculate thingie preaccelerations
      const pageCenterOfMass = getPageCenterOfMass(pageThingies)
      const thingieUpdateFloor = pageThingies.reduce((prev, curr) => (prev?.update_count || 0) < (curr?.update_count || 0) ? prev : curr, { update_count: 0 })
      // Update preaccelerations of thingies on this page
      await updatePageThingiePreaccelerations(pageThingies, pageCenterOfMass, thingieUpdateFloor.update_count || 0)
      // Add all thingie filesizes if images or sounds
      const thingiesLength = pageThingies.length
      for (let j = 0; j < thingiesLength; j++) {
        const thingie = pageThingies[j]
        if (thingie.file_ref) { pageBytes += thingie.file_ref.filesize }
      }
      // Determine if page is too full
      const saturated = pageBytes > 40000000 || pageThingies.length > 40
      // Change page state to metastable if saturated and in clumping state
      if (saturated && page.state === 'clumping') {
        // Update and return page
        const updated = await MC.model.Page
          .findOneAndUpdate({ _id: page._id }, { state: 'metastable' }, { new: true })
          .populate({
            path: 'portal_refs',
            sort: { createdAt: 1 },
            populate: [
              {
                path: 'thingie_ref',
                select: 'colors'
              },
              {
                path: 'vertices.page_ref',
                select: 'print_refs'
              }
            ]
          })
        // Broadcast page changes to socket
        socket.emit('cron|page-state-update|initialize', updated)
        // Change page state to clumping empty enough
      } else if (pageBytes <= 37000000 && pageThingies.length <= 37 && page.state === 'leaking') {
        // Update and return page
        const updated = await MC.model.Page
          .findOneAndUpdate({ _id: page._id }, { state: 'clumping' }, { new: true })
          .populate({
            path: 'portal_refs',
            sort: { createdAt: 1 },
            populate: [
              {
                path: 'thingie_ref',
                select: 'colors'
              },
              {
                path: 'vertices.page_ref',
                select: 'print_refs'
              }
            ]
          })
        // Broadcast page changes to socket
        socket.emit('cron|page-state-update|initialize', updated)
      }
    }
  } catch (e) {
    console.log('======================== [Function: GOA - pagePreaccelerator]')
    console.log(e)
  }
}

/**
 * @method versesPreaccelerator
 */

const versesPreaccelerator = async () => {
  try {
    const verses = await MC.model.Verse.find({})
    const len = verses.length
    for (let i = 0; i < len; i++) {
      await pagePreaccelerator(verses[i])
    }
  } catch (e) {
    console.log('====================== [function: GOA - versesPreaccelerator]')
    console.log(e)
  }
}

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------
MC.app.on('mongoose-connected', async () => {
  console.log('🔱 Godess Of Anarchy started')
  try {
    await versesPreaccelerator()
    socket.disconnect()
    console.log('🔱 GOA updates completed')
    process.exit(0)
  } catch (e) {
    console.log('=================================== [Cron: Godess Of Anarchy]')
    console.log(e)
    process.exit(0)
  }
})
