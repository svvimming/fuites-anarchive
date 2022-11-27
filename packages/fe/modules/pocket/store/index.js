// /////////////////////////////////////////////////////////////////////// State
// -----------------------------------------------------------------------------
const state = () => ({
  pocket: '',
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
  // ////////////////////////////////////////////////////// setPocketConsistency
  setPocketToken ({ commit }, token) {
    commit('SET_POCKET_TOKEN', token)
  },
  // /////////////////////////////////////////////////////////// setPocketIsOpen
  setPocketIsOpen ({ commit }, val) {
    commit('SET_POCKET_IS_OPEN', val)
  }
}

// /////////////////////////////////////////////////////////////////// Mutations
// -----------------------------------------------------------------------------
const mutations = {
  SET_POCKET_TOKEN (state, incoming) {
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
