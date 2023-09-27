/*
 *
 * 📦 [module] compost
 *
 */

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
// ///////////////////////////////////////////////////////////////////// General
import Path from 'path'

// ///////////////////////////////////////////////////////////////////// Plugins
const CompostPlugin = Path.resolve(__dirname, 'plugins/index.js')

// /////////////////////////////////////////////////////////////////// Functions
// -----------------------------------------------------------------------------
// ////////////////////////////////////////////////////////////// registerPlugin
const registerPlugin = (instance, next) => {
  return new Promise((next) => {
    const CompostPluginDst = instance.addTemplate({
      src: CompostPlugin,
      fileName: 'compost/plugin-index.js'
    }).dst
    instance.options.plugins.push({
      src: Path.join(instance.options.buildDir, CompostPluginDst),
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
