// /////////////////////////////////////////////////////////////////////// State
// -----------------------------------------------------------------------------
const state = () => ({
  compostPortalIsOpen: false
})

// ///////////////////////////////////////////////////////////////////// Getters
// -----------------------------------------------------------------------------
const getters = {
  compostPortalIsOpen: state => state.compostPortalIsOpen
}

// ///////////////////////////////////////////////////////////////////// Actions
// -----------------------------------------------------------------------------
const actions = {
  // ////////////////////////////////////////////////////////// setCompostIsOpen
  setCompostPortalIsOpen ({ commit }, val) {
    commit('SET_COMPOST_PORTAL_IS_OPEN', val)
  }
}

// /////////////////////////////////////////////////////////////////// Mutations
// -----------------------------------------------------------------------------
const mutations = {
  SET_COMPOST_PORTAL_IS_OPEN (state, val) {
    state.compostPortalIsOpen = val
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
