/**
 * @note ❗️DO NOT DELETE THIS MODULE
 */

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import Fs from 'fs-extra'
import StartCase from 'lodash/startCase'
import KebabCase from 'lodash/kebabCase'
import CamelCase from 'lodash/camelCase'
import Chalk from 'chalk'

import {
  defineNuxtModule,
  createResolver,
  addComponentsDir,
  // addComponent,
  addImports,
  addPlugin,
} from 'nuxt/kit'

const { resolve } = createResolver(import.meta.url)
// ////////////////////////////////////////////////////////////////////// Config
// -----------------------------------------------------------------------------
const meta = {
  name: '@fuites/site-modules',
  configKey: 'fuitesSiteModules',
  compatibility: {
    nuxt: '^3.0.0'
  }
}

// /////////////////////////////////////////////////////////////////// Functions
// -----------------------------------------------------------------------------
/**
 * @method toPascalCase
 */

const convertCase = (string, to = 'kebab') => {
  const startCase = StartCase(string).replaceAll(' ', '')
  if (to === 'pascal') { return startCase }
  if (to === 'kebab') { return KebabCase(startCase) }
  if (to === 'camel') { return CamelCase(startCase) }
  return string
}

/**
 * @method registerComponents
 */

const registerComponents = path => {
  path = resolve(path, 'components')
  if (!Fs.existsSync(path)) { return }
  console.log(Chalk.bold('     → Components'))
  addComponentsDir({
    path,
    global: true
  })
  Fs.readdirSync(path).filter(file => file.includes('.vue')).forEach(component => {
    const name = StartCase(component.replace('.vue', '')).replaceAll(' ', '')
    console.log(Chalk.magenta(`       <${name} />`))
  })
}

/**
 * @method registerPlugins
 */

const registerPlugins = path => {
  path = resolve(path, 'plugins')
  if (!Fs.existsSync(path)) { return }
  console.log(Chalk.bold('     → Plugins'))
  Fs.readdirSync(path).filter(file => file.includes('.js')).forEach(plugin => {
    addPlugin(resolve(path, plugin))
    console.log(Chalk.cyan(`       ${plugin}`))
  })
}
/**
 * @method registerStores
 */

const registerStore = path => {
  path = resolve(path, 'stores')
  if (!Fs.existsSync(path)) { return }
  console.log(Chalk.bold('     → Stores'))
  Fs.readdirSync(path).filter(file => file.includes('.js')).forEach(store => {
    const slug = store.split('.js')[0]
    const name = convertCase(slug, 'camel')
    addImports({
      name,
      from: resolve(path, store)
    })
    console.log(Chalk.green(`       ${name}()`))
  })
}

// /////////////////////////////////////////////////////////////////////// Setup
// -----------------------------------------------------------------------------
const setup = (_, nuxt) => {
  const options = nuxt.options
  const hex1 = '#3e1c00'
  const hex2 = '#3e1c00'
  const hex3 = '#FFFFFF'
  console.log('\n  ⚡️', `${Chalk.underline.hex(hex1).bold('load:package ')}${Chalk.bgHex(hex2).hex(hex3).bold(' fe ')}\n`)
  options.css = options.css.reverse()
  const basePath = resolve('..')
  const modulesPath = resolve(basePath, 'modules')
  const modules = Fs.readdirSync(modulesPath)
  const len = modules.length
  for (let i = 0; i < len; i++) {
    const module = modules[i]
    const modulePath = resolve(modulesPath, module)
    if (!Fs.statSync(modulePath).isDirectory()) {
      continue
    } else {
      console.log('\n  🧰', `${Chalk.underline.hex(hex1).bold('load:module ')}${Chalk.bgHex(hex2).hex(hex3).bold(` ${module} `)}`)
      registerStore(modulePath)
      registerPlugins(modulePath)
      registerComponents(modulePath)
    }
  }
}

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export default defineNuxtModule({
  meta,
  setup
})
