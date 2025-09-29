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

const { HexToHsl, HslToHex } = require('@Module_Utilities')

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
      let preacceleration = (updateCount - updateCountFloor) * distance / weight
      if (Number.isNaN(preacceleration)) {
        preacceleration = 0
      }
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
 * @method hexColorsToHslAverage
 * @desc Takes an array of hex colors, averages them in HSL space and returns HSL
 * @param {[String]} hexColors - Array of hex color codes (with or without #)
 * @returns {{h:number,s:number,l:number}} - Averaged color as HSL object
 */

const hexColorsToHslAverage = hexColors => {
  // Return random color if no colors provided
  if (!hexColors || hexColors.length === 0) {
    return { h: Math.random() * 360, s: Math.random() * 100, l: Math.random() * 100 }
  }
  // Convert hex colors to HSL colors
  const hslColors = hexColors
    .filter(v => typeof v === 'string' && /^#?[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/.test(v))
    .map(v => {
      let s = v.replace(/^#/, '')
      if (s.length === 3) { s = s.split('').map(ch => ch + ch).join('') }
      return HexToHsl(`#${s.toLowerCase()}`)
    })
  // Return random color if no colors provided
  if (hslColors.length === 0) {
    return { h: Math.random() * 360, s: Math.random() * 100, l: Math.random() * 100 }
  }
  // Calculate the average saturation and lightness
  const n = hslColors.length
  let avgS = hslColors.reduce((sum, c) => sum + c.s, 0) / n
  let avgL = hslColors.reduce((sum, c) => sum + c.l, 0) / n
  // Calculate the average hue
  const vector = hslColors.reduce((acc, c) => {
    const rad = (c.h * Math.PI) / 180
    acc.x += Math.cos(rad)
    acc.y += Math.sin(rad)
    return acc
  }, { x: 0, y: 0 })
  const meanX = vector.x / n
  const meanY = vector.y / n
  let avgH = Math.atan2(meanY, meanX) * (180 / Math.PI)
  if (avgH < 0) avgH += 360
  // If hues cancel out (near-zero vector), fall back to first non-gray hue or 0
  if (Number.isNaN(avgH) || (Math.abs(meanX) < 1e-6 && Math.abs(meanY) < 1e-6)) {
    const firstColored = hslColors.find(c => c.s > 0)
    avgH = firstColored ? firstColored.h : 0
  }
  if (Number.isNaN(avgH)) {
    avgH = Math.random() * 360
  }
  if (Number.isNaN(avgS)) {
    avgS = Math.random() * 100
  }
  if (Number.isNaN(avgL)) {
    avgL = Math.random() * 100
  }
  // Return the average HSL color
  return { h: avgH, s: avgS, l: avgL }
}

/**
 * @method getVersePortalColors
 * @desc Takes the primary and secondary colors of a verse and return two contrasting colors
 * @param {[String]} primaryColors - Array of primary hex color codes (with or without #)
 * @param {[String]} secondaryColors - Array of secondary hex color codes (with or without #)
 * @returns {{primary:string,secondary:string}} - Primary and secondary colors as hex colors
 */

const getVersePortalColors = (primaryColors, secondaryColors) => {
  // Calculate the average primary and secondary colors
  const primaryHSL = hexColorsToHslAverage(primaryColors)
  const secondaryHSL = hexColorsToHslAverage(secondaryColors)
  // Distance of hues in the circle (0-360)
  let hueDiff = Math.abs(primaryHSL.h - secondaryHSL.h)
  if (hueDiff > 180) {
    hueDiff = 360 - hueDiff
  }
  // If the hues are too close (<40°), we move the second one away
  if (hueDiff < 40) {
    secondaryHSL.h = (secondaryHSL.h + 80) % 360
    primaryHSL.h = (primaryHSL.h - 40) % 360
  }
  // If the lightness values are too close (<15), move the second one away
  const lightnessDiff = Math.abs(primaryHSL.l - secondaryHSL.l)
  if (lightnessDiff < 15) {
    if (secondaryHSL.l >= primaryHSL.l) {
      secondaryHSL.l = (((primaryHSL.l + 30) % 100) + 100) % 100
    } else {
      secondaryHSL.l = (((primaryHSL.l - 30) % 100) + 100) % 100
    }
  }
  // Return the primary and secondary colors as hex colors
  return {
    primary: HslToHex(primaryHSL.h, primaryHSL.s, primaryHSL.l),
    secondary: HslToHex(secondaryHSL.h, secondaryHSL.s, secondaryHSL.l)
  }
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
    // Initialize arrays to store primary and secondary colors
    const primaryColors = []
    const secondaryColors = []
    // Loop through each page
    for (let i = 0; i < len; i++) {
      const page = pages[i]
      let pageBytes = 0
      // Get all the thingies on this page
      const pageThingies = await MC.model.Thingie
        .find({ verse: verse.name, location: page.name })
        .populate({ path: 'file_ref', select: 'filename file_ext filesize file_url' })
      // Get all the primary and secondary colors on this page
      pageThingies.forEach(thingie => {
        if (thingie.colors[0]) {
          primaryColors.push(thingie.colors[0])
        }
        if (thingie.colors[1]) {
          secondaryColors.push(thingie.colors[1])
        }
      })
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
        console.log(`Page ${page.name} in verse ${verse.name} changed from clumping to metastable.`)
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
        console.log(`Page ${page.name} in verse ${verse.name} changed from leaking to clumping.`)
        // Broadcast page changes to socket
        socket.emit('cron|page-state-update|initialize', updated)
      }
    }
    // Return computed primary and secondary verse colors
    return getVersePortalColors(primaryColors, secondaryColors)
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
      // Calculate preaccelerations of all thingies in this verse and return average colors of the verse
      const verseColorResults = await pagePreaccelerator(verses[i])
      // Update the verse with the average colors
      await MC.model.Verse.findOneAndUpdate({ _id: verses[i]._id }, { average_colors: verseColorResults })
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
