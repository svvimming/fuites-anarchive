console.log('🚀️ [app] liftoff')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
// ///////////////////////////////////////////////////////////////////// General
const Cors = require('cors')
const BodyParser = require('body-parser')
const ExpressSession = require('express-session')
const ConnectMongoStore = require('connect-mongo')
const Fs = require('fs-extra')
require('mongoose')

const MC = require('@Root/config')

// /////////////////////////////////////////////////// Add CORS response headers
// -----------------------------------------------------------------------------
MC.app.use(Cors(MC.cors))

// ////////////////////////////////////////////////////// Initialize Body Parser
// -----------------------------------------------------------------------------
MC.app.use(BodyParser.urlencoded({ extended: true, limit: '25mb' }))
MC.app.use(BodyParser.json({ limit: '25mb' }))

// ////////////////////////////////////////////////// Initialize Express Session
// -----------------------------------------------------------------------------
MC.expressSessionOptions.store = ConnectMongoStore.create({
  client: MC.mongooseConnection
})
MC.expressSession = ExpressSession(MC.expressSessionOptions)
MC.app.use(MC.expressSession)

// ////////////////////////////////////////////////////////// Import all Modules
// -----------------------------------------------------------------------------
try {
  const excluded = ['database', 'utilities']
  const modulesRoot = `${MC.packageRoot}/modules`
  const items = Fs.readdirSync(modulesRoot)
  let modulePath
  items.forEach((name) => {
    if (!excluded.includes(name)) {
      modulePath = `${modulesRoot}/${name}`
      if (Fs.statSync(modulePath).isDirectory()) {
        const moduleName = (name[0].toUpperCase() + name.substring(1)).replace(/-./g, x => x[1].toUpperCase())
        require(`@Module_${moduleName}`)
      }
    }
  })
} catch (e) {
  console.log(e)
}

// const updatePortalCollection = async () => {
//   try {
//     const portals = await MC.model.Portal.find({})
//     const len = portals.length
//     for (let i = 0; i < len; i++) {
//       const portal = portals[i]
//       // const vertices = portal.vertices
//       // for (let j = 0; j < vertices.length; j++) {
//       //   const location = vertices[j].location
//       //   const page = await MC.model.Page.findOne({ verse: 'music', name: location })
//       //   portal.vertices[j].page_ref = page._id
//       // }
//       // portal.verse_ref = '677722f4d883c52fcc5fd25a'
//       await portal.save()
//     }
//   } catch (e) {
//     console.log(e)
//   }
// }

// updatePortalCollection()
