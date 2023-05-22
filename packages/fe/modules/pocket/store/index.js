// /////////////////////////////////////////////////////////////////////// State
// -----------------------------------------------------------------------------
const state = () => ({
  pocket: {
    token: '',
    thingies: []
  },
  pocketIsOpen: false
})

// ///////////////////////////////////////////////////////////////////// Getters
// -----------------------------------------------------------------------------
const getters = {
  pocket: state => state.pocket,
  pocketIsOpen: state => state.pocketIsOpen
}

// ///////////////////////////////////////////////////////////////////// Actions
// -----------------------------------------------------------------------------
const actions = {
  // ///////////////////////////////////////////////////////////////// getPocket
  async getPocket ({ commit }, token) {
    try {
      const response = await this.$axiosAuth.get(`/get-pocket?token=${token}`)
      const pocket = response.data.payload
      if (pocket) {
        commit('SET_POCKET', pocket)
      } else {
        throw 'pocket does not exist!'
      }
    } catch (e) {
      console.log('===================== [Store Action: collections/getPocket]')
      console.log(e)
      return false
    }
  },
  // ////////////////////////////////////////////////////////// postUpdatePocket
  async postUpdatePocket ({ commit, getters }, incoming) {
    try {
      console.log('hit', incoming)
      if (getters.pocket.token === incoming.thingie.last_update_token) {
        let thingies
        if (incoming.action === 'add') {
          if (!getters.pocket.thingies.includes(incoming.thingie._id)) {
            thingies = [incoming.thingie._id].concat(getters.pocket.thingies)
          } else {
            throw 'this thingie is already in the pocket!'
          }
        } else if (incoming.action === 'remove') {
          if (getters.pocket.thingies.includes(incoming.thingie._id)) {
            thingies = getters.pocket.thingies.filter(id => id !== incoming.thingie._id)
          } else {
            throw 'tried to remove a thingie not in the pocket!'
          }
        } else {
          throw 'missing pocket update action type'
        }
        const data = { token: getters.pocket.token, thingies }
        const response = await this.$axiosAuth.post('/post-update-pocket', data)
        const pocket = response.data.payload
        commit('SET_POCKET', pocket)
      }
    } catch (e) {
      console.log('=================== [Store Action: pocket/postUpdatePocket]')
      console.log(e)
      return false
    }
  },
  // /////////////////////////////////////////////////////////// setPocketIsOpen
  setPocketIsOpen ({ commit }, val) {
    commit('SET_POCKET_IS_OPEN', val)
  }
}

// /////////////////////////////////////////////////////////////////// Mutations
// -----------------------------------------------------------------------------
const mutations = {
  SET_POCKET (state, incoming) {
    state.pocket = incoming
  },
  SET_POCKET_IS_OPEN (state, val) {
    state.pocketIsOpen = val
  }
}

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export default {
  state,
  getters,
  actions,
  mutations
}
