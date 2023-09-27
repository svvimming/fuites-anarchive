console.log('📦 [module] database')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Mongoose = require('mongoose')
const MongooseSlugUpdater = require('mongoose-slug-updater')
const Fs = require('fs')

const MC = require('@Root/config')

// ///////////////////////////////////////////////////////// Mongoose & DB Setup
// -----------------------------------------------------------------------------
// ///////////////////////////////////////////////////////////////////// Plugins
Mongoose.plugin(MongooseSlugUpdater)

// ///////////////////////////////////////////// Initialize Mongoose Connections
const mongoInstances = Object.keys(MC.mongoInstances)
// connect to each mongoose instance in the be config
const initMongooseInstanceConnections = async () => {
  try {
    const modulesRoot = `${MC.packageRoot}/modules`
    const modules = Fs.readdirSync(modulesRoot)
    for (let i = 0; i < mongoInstances.length; i++) {
      const instance = mongoInstances[i]
      const connection = await Mongoose.createConnection(
        MC.mongoInstances[instance].databaseUrl,
        MC.mongoInstances[instance].mongoConnectionOptions
      ).asPromise()
      modules.forEach((name) => {
        if (!MC.mongoInstances[instance].excludeModules.includes(name)) {
          const modulePath = `${modulesRoot}/${name}`
          if (Fs.statSync(modulePath).isDirectory()) {
            const modelPath = `${modulePath}/model`
            if (Fs.existsSync(modelPath) && Fs.statSync(modelPath).isDirectory()) {
              let modelName = name.charAt(0).toUpperCase() + name.slice(1)
              if (name === 'uploader') { modelName = modelName.slice(0, -2) }
              connection.model(modelName, require(modelPath))
            }
          }
        }
      })
      MC.mongoInstances[instance].mongooseConnection = connection.getClient()
      MC.mongoInstances[instance].model = connection.models
    }
    MC.app.emit('mongoose-connected')
  } catch (e) {
    console.log('==================[Function: initMongooseInstanceConnections]')
    console.log(e)
  }
}

initMongooseInstanceConnections()
