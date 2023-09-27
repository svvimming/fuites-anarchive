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
const moment = require('moment')
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

// ////////////////////////////////////////////////////////////////// Initialize
MC.app = Express()

// /////////////////////////////////////////////////////////////////// Functions
// -----------------------------------------------------------------------------
const pageTemperatureCheck = async () => {
  try {
    // Get all thingies updated in the last day
    const recentlyUpdatedThingies = await MC.mongoInstances[instance].model.Thingie.find({
      updatedAt: {
        $gte: moment().subtract(2, 'hours').toDate()
      }
    })
    // Generate a list of pages from where these thingies are located
    const recentlyUpdatedPages = [...new Set(recentlyUpdatedThingies.map(thingie => thingie.location))]
    const pages = await MC.mongoInstances[instance].model.Page
      .find({
        name: {
          $in: recentlyUpdatedPages
        }
      }).select('name temperature init_screencap')
    // generate an array of objects corresponding to each of these pages with
    // their name, old temperature and a newly calculated temperature
    const pageTemperatures = []
    const len = pages.length
    for (let i = 0; i < len; i++) {
      const pageThingies = await MC.mongoInstances[instance].model.Thingie.find({ location: pages[i].name })
      const thingieTemperatures = pageThingies.map(thingie => thingie.update_count + thingie.preacceleration)
      pageTemperatures.push({
        name: pages[i].name,
        oldTemp: pages[i].temperature || 0,
        newTemp: thingieTemperatures.reduce((partialSum, a) => partialSum + a, 0),
        init_screencap_state: pages[i].init_screencap
      })
    }
    // check temperature fluctuation and decide if the page should generate a
    // screencap. Also update page temperature to new calculation.
    // push results to an array
    const margin = Rules[instance].cyanobot.temperature_margin
    const results = []
    for (let i = 0; i < len; i++) {
      const page = pageTemperatures[i]
      let initScreencap = page.init_screencap_state || false
      if (Math.abs(page.newTemp - page.oldTemp) > margin) {
        initScreencap = true
      }
      const updated = await MC.mongoInstances[instance].model.Page.findOneAndUpdate({ name: page.name }, {
        init_screencap: initScreencap,
        temperature: page.newTemp
      }, { new: true })
      results.push({
        page: updated.name,
        temperature: updated.temperature,
        init_screencap: updated.init_screencap
      })
    }
    return results
  } catch (e) {
    console.log('================= [Function: cyanobot - pageTemperatureCheck]')
    console.log(e)
  }
}

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------
MC.app.on('mongoose-connected', async () => {
  console.log('🌡️ cyanobot temperature check started')
  try {
    const mongoInstances = Object.keys(MC.mongoInstances)
    if (!instance) {
      throw new Error('Missing argument: no Mongo instance name provided.')
    }
    if (!mongoInstances.includes(instance)) {
      throw new Error('The provided instance does not exist.')
    }
    const temperatureUpdates = await pageTemperatureCheck()
    console.log(`${temperatureUpdates.length} pages updated with new temperatures:`)
    console.log(temperatureUpdates)
    console.log('🌡️ cyanobot finished')
    process.exit(0)
  } catch (e) {
    console.log('============================================ [Cron: cyanobot]')
    console.log(e)
    process.exit(0)
  }
})
