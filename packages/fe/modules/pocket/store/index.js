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
