/*
 *
 * 📦 [module] pocket
 *
 */

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
// ///////////////////////////////////////////////////////////////////// General
import Path from 'path'

// ///////////////////////////////////////////////////////////////////// Plugins
const PocketPlugin = Path.resolve(__dirname, 'plugins/index.js')

// /////////////////////////////////////////////////////////////////// Functions
// -----------------------------------------------------------------------------
// ////////////////////////////////////////////////////////////// registerPlugin
const registerPlugin = (instance, next) => {
  return new Promise((next) => {
    const PocketPluginDst = instance.addTemplate({
      src: PocketPlugin,
      fileName: 'pocket/plugin-index.js'
    }).dst
    instance.options.plugins.push({
      src: Path.join(instance.options.buildDir, PocketPluginDst),
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
