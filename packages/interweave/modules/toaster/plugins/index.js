/*
 *
 * 🔌 [plugin | toaster] index
 *
 */

// ///////////////////////////////////////////////////////// Imports & Variables
// -----------------------------------------------------------------------------
import Store from '@/modules/toaster/store'

// /////////////////////////////////////////////////////////////////// Functions
// -----------------------------------------------------------------------------
// /////////////////////////////////////////////////////////////// registerStore
const registerStore = (app, next) => {
  return new Promise((next) => {
    app.store.registerModule('toaster', Object.assign({
      namespaced: true
    }, Store))
    next()
  })
  if (next) { return next() }
}

// ///////////////////////////////////////////////////////////////////// toaster
const toaster = (app) => {
  return {
    addToast (toast) {
      app.store.dispatch('toaster/addMessage', toast)
    },
    removeToast (id) {
      app.store.dispatch('toaster/removeMessage', id)
    }
  }
}

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export default async function ({ app }, inject) {
  await registerStore(app)
  inject('toaster', toaster(app))
}
