// /////////////////////////////////////////////////////////////////////// State
// -----------------------------------------------------------------------------
const state = () => ({
  resonances: []
})

// ///////////////////////////////////////////////////////////////////// Getters
// -----------------------------------------------------------------------------
const getters = {
  resonances: state => state.resonances
}

// ///////////////////////////////////////////////////////////////////// Actions
// -----------------------------------------------------------------------------
const actions = {
  // ///////////////////////////////////////////////////////////////// getTraces
  async getTraces ({ commit, getters }) {
    try {
      const response = await this.$axiosAuth.get('/get-traces')
      commit('ADD_RESONANCES', response.data.payload)
    } catch (e) {
      console.log('======================= [Store Action: rezonator/getTraces]')
      console.log(e)
      return false
    }
  }
}

// /////////////////////////////////////////////////////////////////// Mutations
// -----------------------------------------------------------------------------
const mutations = {
  ADD_RESONANCES (state, payload) {
    state.resonances = payload.traces
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
