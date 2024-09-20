/*
 *
 * 📦 [module] mixer
 *
 */

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import Fs from 'fs-extra'
import StartCase from 'lodash/startCase'
import KebabCase from 'lodash/kebabCase'
import CamelCase from 'lodash/camelCase'

import {
  defineNuxtModule,
  createResolver,
  addImports,
  addPlugin,
} from 'nuxt/kit'

const { resolve } = createResolver(import.meta.url)
const moduleName = 'websocket'
const meta = {
  name: '@fuites/module-websocket',
  configKey: 'fuitesWebsocketModule',
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
 * @method registerPlugins
 */

const registerPlugins = path => {
  path = resolve(path, 'plugins')
  if (!Fs.existsSync(path)) { return }
  Fs.readdirSync(path).filter(file => file.includes('.js')).forEach(plugin => {
    addPlugin(resolve(path, plugin))
    console.log(`Registered ${moduleName} ${plugin} plugin`)
  })
}
/**
 * @method registerStores
 */

const registerStore = path => {
  path = resolve(path, 'stores')
  if (!Fs.existsSync(path)) { return }
  Fs.readdirSync(path).filter(file => file.includes('.js')).forEach(store => {
    const slug = store.split('.js')[0]
    const name = convertCase(slug, 'camel')
    addImports({
      name,
      from: resolve(path, store)
    })
    console.log(`Registered ${moduleName} ${store} store`)
  })
}

// /////////////////////////////////////////////////////////////////////// Setup
// -----------------------------------------------------------------------------
const setup = (_, nuxt) => {
  const basePath = resolve('../../')
  const modulePath = resolve(basePath, `modules/${moduleName}`)
  if (Fs.statSync(modulePath).isDirectory()) {
    console.log(`load:module ${moduleName}`)
    registerStore(modulePath)
    registerPlugins(modulePath)
  }
}

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export default defineNuxtModule({
  meta,
  setup
})
