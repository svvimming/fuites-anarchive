console.log('📦 [module] websocket')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Fs = require('fs')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////// Initialize socket.io
// -----------------------------------------------------------------------------
MC.socket.io = require('socket.io')(MC.server.instance, {
  cors: MC.cors,
  maxHttpBufferSize: 5000000
})

const mongoInstances = Object.keys(MC.mongoInstances)
for (let i = 0; i < mongoInstances.length; i++) {
  const instance = mongoInstances[i]
  MC.socket.io.of(`/${instance}`).use((socket, next) => {
    MC.expressSession[instance](socket.request, {}, next)
  })
  MC.socket.io.of(`/${instance}`).on('connection', (socket) => {
    socket.on('join-room', roomId => socket.join(roomId))
    const listeners = MC.socket.listeners.filter(item => item.name.startsWith(instance))
    const len = listeners.length
    for (let i = 0; i < len; i++) {
      const listener = listeners[i]
      socket.on(listener.name, listener.handler)
    }
  })
}

// //////////////////////////////////////// Import Websocket (socket.io) Modules
// -----------------------------------------------------------------------------
try {
  const items = ['modules', 'crons'].map((dirName) => {
    const path = `${MC.packageRoot}/${dirName}`
    return Fs.readdirSync(path).map(name => `${path}/${name}`)
  }).flat(1)
  let websocketPath
  items.forEach((path) => {
    if (Fs.statSync(path).isDirectory()) {
      websocketPath = `${path}/websocket`
      if (Fs.existsSync(websocketPath) && Fs.statSync(websocketPath).isDirectory()) {
        Fs.readdirSync(websocketPath).forEach((name) => {
          if (name.includes('.js')) {
            require(`${websocketPath}/${name}`)
          }
        })
      }
    }
  })
} catch (e) {
  console.log(e)
}
