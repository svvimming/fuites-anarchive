console.log('🚀️ [app] liftoff')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
// ///////////////////////////////////////////////////////////////////// General
const Cors = require('cors')
const BodyParser = require('body-parser')
const ExpressSession = require('express-session')
const MongoStore = require('connect-mongo')
const Fs = require('fs-extra')
const CloneDeep = require('lodash/clonedeep')
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
const mongoInstances = Object.keys(MC.mongoInstances)
for (let i = 0; i < mongoInstances.length; i++) {
  const instance = mongoInstances[i]
  const options = CloneDeep(MC.expressSessionOptions)
  options.name = instance
  options.store = MongoStore.create({
    client: MC.mongoInstances[instance].mongooseConnection,
    dbName: MC.mongoInstances[instance].databaseName
  })
  MC.expressSession[instance] = ExpressSession(MC.expressSessionOptions)
  MC.app.use(`/${instance}`, MC.expressSession[instance])
}

// ////////////////////////////////////////////////////////// Import all Modules
// -----------------------------------------------------------------------------
try {
  const modules = ['auth', 'rest', 'websocket']
  const modulesRoot = `${MC.packageRoot}/modules`
  const items = Fs.readdirSync(modulesRoot)
  let modulePath
  items.forEach((name) => {
    if (modules.includes(name)) {
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
