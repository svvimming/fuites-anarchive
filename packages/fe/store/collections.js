// /////////////////////////////////////////////////////////////////////// State
// -----------------------------------------------------------------------------
const state = () => ({
  thingies: []
})

// ///////////////////////////////////////////////////////////////////// Getters
// -----------------------------------------------------------------------------
const getters = {
  thingies: state => state.thingies
}

// ///////////////////////////////////////////////////////////////////// Actions
// -----------------------------------------------------------------------------
const actions = {
  // /////////////////////////////////////////////////////////////// getThingies
  async getThingies ({ commit, getters }) {
    try {
      const response = await this.$axiosAuth.get('/get-thingies')
      commit('ADD_THINGIES', response.data.payload)
    } catch (e) {
      console.log('=================== [Store Action: collections/getThingies]')
      console.log(e)
    }
  },
  // //////////////////////////////////////////////////////////////// addThingie
  addThingie ({ commit }, thingie) {
    commit('ADD_THINGIE', thingie)
  },
  // ///////////////////////////////////////////////////////// postCreateThingie
  async postCreateThingie ({ dispatch }, payload) {
    try {
      const response = await this.$axiosAuth.post('/post-create-thingie', {
        file_id: payload.uploadedFileId
      })
      return response.data.payload
    } catch (e) {
      console.log('================== [Store Action: modify/postCreateThingie]')
      console.log(e)
      return false
    }
  },
  // ///////////////////////////////////////////////////////////// updateThingie
  updateThingie ({ commit, getters }, incoming) {
    const index = getters.thingies.findIndex(obj => obj._id === incoming._id)
    commit('UPDATE_THINGIE', { index, thingie: incoming })
  },
  // ///////////////////////////////////////////////////////// postDeleteThingie
  async postDeleteThingie ({ dispatch }, payload) {
    try {
      const response = await this.$axiosAuth.post('/post-delete-thingie', {
        thingie_id: payload.id
      })
      return response.data.payload
    } catch (e) {
      console.log('================== [Store Action: modify/postDeleteThingie]')
      console.log(e)
      return false
    }
  },
  // ///////////////////////////////////////////////////////////// removeThingie
  removeThingie ({ commit, getters }, thingieId) {
    const index = getters.thingies.findIndex(obj => obj._id === thingieId)
    commit('REMOVE_THINGIE', index)
  }
}

// /////////////////////////////////////////////////////////////////// Mutations
// -----------------------------------------------------------------------------
const mutations = {
  ADD_THINGIES (state, thingies) {
    state.thingies = state.thingies.concat(thingies)
  },
  ADD_THINGIE (state, thingie) {
    state.thingies.push(thingie)
  },
  UPDATE_THINGIE (state, payload) {
    state.thingies.splice(payload.index, 1, payload.thingie)
  },
  REMOVE_THINGIE (state, index) {
    state.thingies.splice(index, 1)
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
