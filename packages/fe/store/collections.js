// /////////////////////////////////////////////////////////////////////// State
// -----------------------------------------------------------------------------
const state = () => ({
  spazes: [],
  thingies: []
})

// ///////////////////////////////////////////////////////////////////// Getters
// -----------------------------------------------------------------------------
const getters = {
  spazes: state => state.spazes,
  thingies: state => state.thingies
}

// ///////////////////////////////////////////////////////////////////// Actions
// -----------------------------------------------------------------------------
const actions = {
  // ///////////////////////////////////////////////////////////////// getSpazes
  async getSpazes ({ commit, getters }) {
    try {
      const response = await this.$axiosAuth.get('/get-spazes')
      commit('ADD_SPAZES', response.data.payload)
    } catch (e) {
      console.log('================== [Store Action: spaze/getSpazes]')
      console.log(e)
      return false
    }
  },
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
  async postCreateThingie ({ dispatch, rootGetters }, payload) {
    try {
      const token = rootGetters['pocket/pocket']
      const data = {
        file_id: payload.uploadedFileId,
        location: payload.location,
        creator_token: token,
        thingie_type: payload.type,
        text: payload.text
      }
      if (payload.at) {
        data.at = payload.at
      }
      if (payload.pathData) {
        data.pathData = payload.pathData
      }
      const response = await this.$axiosAuth.post('/post-create-thingie', data)
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
    if (index >= 0) {
      commit('UPDATE_THINGIE', { index, thingie: incoming })
    }
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
  },
  // /////////////////////////////////////////////////////////////// clearSpazes
  clearSpazes ({ commit, getters}) {
    commit('CLEAR_SPAZES')
  },
  // ///////////////////////////////////////////////////////////// clearThingies
  clearThingies ({ commit, getters}) {
    commit('CLEAR_THINGIES')
  }
}

// /////////////////////////////////////////////////////////////////// Mutations
// -----------------------------------------------------------------------------
const mutations = {
  ADD_SPAZES (state, spazes) {
    state.spazes = state.spazes.concat(spazes)
  },
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
  },
  CLEAR_SPAZES (state) {
    state.spazes = []
  },
  CLEAR_THINGIES (state) {
    state.thingies = []
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
