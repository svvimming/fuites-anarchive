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
  setPocketConsistency ({ commit }) {
    string = ''
    commit('SET_POCKET_CONSISTENCY', string)
  },
  // /////////////////////////////////////////////////////////// setPocketIsOpen
  setPocketIsOpen ({ commit }, val) {
    commit('SET_POCKET_IS_OPEN', val)
  }
}

// /////////////////////////////////////////////////////////////////// Mutations
// -----------------------------------------------------------------------------
const mutations = {
  SET_POCKET_CONSISTENCY (state, incoming) {
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
