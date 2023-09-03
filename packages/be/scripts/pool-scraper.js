// ///////////////////////////////////////////////////// Imports + general setup
// -----------------------------------------------------------------------------
const ModuleAlias = require('module-alias')
const Path = require('path')
const Fs = require('fs-extra')
const Express = require('express')
const Util = require('util')
const Stream = require('stream')
const Pipeline = Util.promisify(Stream.pipeline)
const readline = require('node:readline')
require('dotenv').config({ path: Path.resolve(__dirname, '../.env') })

const MC = require('../config')

const STATIC_DIR = Path.resolve(`${MC.packageRoot}/static`)

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

// ////////////////////////////////////////////////////////////////// Initialize
MC.app = Express()

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------
MC.app.on('mongoose-connected', async () => {
  console.log('Scraping the pool...')
  try {
    const existingText = []
    const oldJsonEntries = []
    if (Fs.existsSync(`${STATIC_DIR}/pool-entries.txt`)) {
      const entries = Fs.createReadStream(`${STATIC_DIR}/pool-entries.txt`)
      const rl = readline.createInterface({
        input: entries,
        crlfDelay: Infinity
      })
      for await (const line of rl) {
        const entry = JSON.parse(line)
        existingText.push(entry.text)
        oldJsonEntries.push(line)
      }
      Fs.unlinkSync(`${STATIC_DIR}/pool-entries.txt`)
    }
    const newEntries = []
    const poolThingies = await MC.model.Thingie.find({ location: 'pool', thingie_type: 'text' })
    const len = poolThingies.length
    for (let i = 0; i < len; i++) {
      thingie = poolThingies[i]
      if (!existingText.includes(thingie.text)) {
        const text = JSON.stringify({
          text: thingie.text, 
          date: thingie.createdAt, 
          font: {
            family: thingie.fontfamily,
            size: thingie.fontsize,
            color: thingie.colors[0]
          }
        })
        existingText.push(thingie.text)
        newEntries.push(text)
      }
    }
    const updatedEntries = oldJsonEntries.concat(newEntries)
    const length = updatedEntries.length
    for (let i = 0; i < length; i++) {
      await Pipeline(`${updatedEntries[i]}\n`, Fs.createWriteStream(`${STATIC_DIR}/pool-entries.txt`, { flags: 'a' }))
    }
    console.log(updatedEntries)
    process.exit(0)
  } catch (e) {
    console.log('====================================== [Script: Pool scraper]')
    console.log(e)
    process.exit(0)
  }
})
