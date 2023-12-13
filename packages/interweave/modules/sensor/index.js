/*
 *
 * 📦 [module] sensor
 *
 */

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
// ///////////////////////////////////////////////////////////////////// General
import Path from 'path'

// ///////////////////////////////////////////////////////////////////// Plugins
const SensorPlugin = Path.resolve(__dirname, 'plugins/index.js')

// /////////////////////////////////////////////////////////////////// Functions
// -----------------------------------------------------------------------------
// ////////////////////////////////////////////////////////////// registerPlugin
const registerPlugin = (instance, next) => {
  return new Promise((next) => {
    const SensorPluginDst = instance.addTemplate({
      src: SensorPlugin,
      fileName: 'sensor/plugin-index.js'
    }).dst
    instance.options.plugins.push({
      src: Path.join(instance.options.buildDir, SensorPluginDst),
      ssr: undefined,
      mode: undefined
    })
    next()
  })
}

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export default async function () {
  await registerPlugin(this)
}
