/*
 *
 * 📦 [module] rezonator
 *
 */

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
// ///////////////////////////////////////////////////////////////////// General
import Path from 'path'

// ///////////////////////////////////////////////////////////////////// Plugins
const RezonatorPlugin = Path.resolve(__dirname, 'plugins/index.js')

// /////////////////////////////////////////////////////////////////// Functions
// -----------------------------------------------------------------------------
// ////////////////////////////////////////////////////////////// registerPlugin
const registerPlugin = (instance, next) => {
  return new Promise((next) => {
    const RezonatorPluginDst = instance.addTemplate({
      src: RezonatorPlugin,
      fileName: 'rezonator/plugin-index.js'
    }).dst
    instance.options.plugins.push({
      src: Path.join(instance.options.buildDir, RezonatorPluginDst),
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
