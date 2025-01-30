/**
 * Cyanobot looks at the thingies on each page and sums their update counts (and possibly preaccelerations?).
 * This sum will be stored in the page document as 'temperature'.
 * Cyanobot will periodically (every 2 hours?) take the temperature of a page and if there is a
 * fluctuation in temperature above or below a certain margin, cyanobot will
 * enable a key on that page, called `init_screencap`. The next time the page is
 * loaded, if the init_screencap key is true, the page will generate a screen
 * shot and send it to the page document in the database. The init_screencap key
 * will be set to false at the same time.
 *
 * ⏱️️ [Cron | every 2 hours]
 *
 */
console.log('🌡️ [cron] cyanobot')

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

// ////////////////////////////////////////////////////////////////// Initialize
MC.app = Express()

// /////////////////////////////////////////////////////////////////// Functions
// -----------------------------------------------------------------------------
const pageTemperatureCheck = async () => {
  try {
    // Get all verses
    const verses = await MC.model.Verse.find({})
    const len = verses.length
    // Loop through all Verses
    for (let j = 0; j < len; j++) {
      const verse = verses[j]
      // Get all thingies updated in the last day
      const recentlyUpdatedThingies = await MC.model.Thingie.find({
        verse: verse.name,
        'last_update.timestamp': {
          $gte: Date.now() - 86400000 // = one day in milliseconds
        }
      })
      // Generate a list of pages from where these thingies are located
      const recentlyUpdatedPages = [
        ...new Set(recentlyUpdatedThingies.map(thingie => thingie.location))
      ].filter(el => el !== 'compost' && el !== 'pocket')
      // Get each page with a recently updated thingie
      const pages = await MC.model.Page.find({
        verse: verse.name,
        name: {
          $in: recentlyUpdatedPages
        }
      }).select('name temperature init_screencap')
      // Generate an array of page updates
      const margin = 100
      const updates = []
      const len = pages.length
      let screencapCount = 0
      for (let i = 0; i < len; i++) {
        const page = pages[i]
        const pageThingies = recentlyUpdatedThingies.filter(thingie => thingie.location === page.name)
        const thingieTemperatures = pageThingies.map(thingie => (thingie.update_count || 0) + (thingie.preacceleration || 0))
        const oldTemp = page.temperature || 0
        const newTemp = thingieTemperatures.reduce((partialSum, a) => partialSum + a, 0)
        // check temperature fluctuation and decide if the page should generate a screencap
        const initScreencap = !page.init_screencap && Math.abs(newTemp - oldTemp) > margin
        if (initScreencap) { screencapCount++ }
        // Update page temperature and screencap state
        updates.push({
          updateOne: {
            filter: { _id: page._id },
            update: {
              temperature: newTemp,
              init_screencap: initScreencap
            }
          }
        })
      }
      // Write changes to DB
      await MC.model.Page.bulkWrite(updates)
      console.log(`${updates.length} page(s) updated in verse ${verse.name}. ${screencapCount} screencap(s) initialized.`)
    }
  } catch (e) {
    console.log('================= [Function: Cyanobot - pageTemperatureCheck]')
    console.log(e)
  }
}

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------
MC.app.on('mongoose-connected', async () => {
  console.log('🌡️ cyanobot temperature check started')
  try {
    await pageTemperatureCheck()
    console.log('🌡️ cyanobot finished')
    process.exit(0)
  } catch (e) {
    console.log('============================================ [Cron: cyanobot]')
    console.log(e)
    process.exit(0)
  }
})
