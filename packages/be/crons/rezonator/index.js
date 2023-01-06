/**
 *
 * ⏱️️ [Cron | every day at noon]
 * Rezonator looks for tiny resonances throughout the site and saves them as traces
 *
 */
console.log('🌀️ [cron] Rezonator')

// ///////////////////////////////////////////////////// Imports + general setup
// -----------------------------------------------------------------------------
const ModuleAlias = require('module-alias')
const Path = require('path')
const Fs = require('fs-extra')
const Express = require('express')
require('dotenv').config({ path: Path.resolve(__dirname, '../../.env') })

const MC = require('../../config')

// ////////////////////////////////////////////////////////////////// Initialize
MC.app = Express()

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
require('@Module_Pocket')
require('@Module_Thingie')
require('@Module_Uploader')
require('@Module_Spaze')
require('@Module_Portal')
require('@Module_Trace')

// /////////////////////////////////////////////////////////////////// Functions
// --------------------------------------------------------- getCommonSubstrings
const getCommonSubstrings = (string, chars) => {
  const len = string.length
  const matches = []
  for (let i = 0; i < len - chars; i++) {
    const regex = new RegExp(string.substring(i, i + chars), 'g')
    matches.push(string.match(regex))
  }
  return matches.flat()
}

// ------------------------------------------------------------- countDuplicates
const countDuplicates = (array) => {
  const counts = {}
  array.forEach((el) => {
    counts[el] = (counts[el] || 0) + 1
  })
  return counts
}

// ------------------------------------------------------------ recordTextTraces
const recordTextTraces = async () => {
  try {
    const pockets = await MC.model.Pocket
      .find({})
      .select('token')
    const portals = await MC.model.Portal
      .find({})
      .select('edge')
    const spazes = await MC.model.Spaze
      .find({})
      .select('name')
    const thingies = await MC.model.Thingie
      .find({})
      .select('file_ref consistencies location text')
      .populate({
        path: 'file_ref',
        select: 'filename'
      })
    const pocketTraces = pockets.map((item) => {
      return item.token.split('-')
    }).flat()
    const portalTraces = portals.map((item) => {
      return item.edge.split(/[_-]+/)
    }).flat()
    const spazeTraces = spazes.map((item) => {
      return item.name.split('-')
    }).flat()
    const thingieTraces = thingies.map((item) => {
      const consistencies = item.consistencies.map(el => el.split(' ').flat()).flat()
      const location = item.location.split('-').flat()
      let text = []
      if (item.text) {
        text = item.text.split(' ').filter(el => el.length > 2).flat()
      }
      return [consistencies, location, text].flat()
    }).flat()
    const traces = pocketTraces.concat(portalTraces, spazeTraces, thingieTraces)
    const wordCounts = countDuplicates(traces)
    const dups = []
    for (const prop in wordCounts) {
      if (wordCounts[prop] > 1) {
        dups.push(prop)
      }
    }
    const string = traces.join('').replace(/[^0-9a-z]/gi, '')
    const threes = countDuplicates(getCommonSubstrings(string, 3))
    const fours = countDuplicates(getCommonSubstrings(string, 4))
    const fives = countDuplicates(getCommonSubstrings(string, 5))
    const substrings = [threes, fours, fives]
    const duplicates = []
    substrings.forEach((object) => {
      for (const prop in object) {
        if (object[prop] >= 15) {
          duplicates.push(prop)
        }
      }
    })
    await MC.model.Trace.create({ traces: duplicates })
  } catch (e) {
    console.log('================================ [Function: recordTextTraces]')
    console.log(e)
  }
}

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------
MC.app.on('mongoose-connected', async () => {
  console.log('🌀 Rezonator started')
  try {
    await recordTextTraces()
    console.log('🌀 Rezonator traces recorded')
    process.exit(0)
  } catch (e) {
    console.log('=========================================== [Cron: Rezonator]')
    console.log(e)
    process.exit(0)
  }
})
