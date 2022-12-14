// /////////////////////////////////////////////////////////////////// Functions
const getNewSpazeName = (array) => {
  const consistencies = array.join(' ').split(' ')
  let index = Math.floor(Math.random() * consistencies.length)
  let name = consistencies[index]
  consistencies.splice(index, 1)
  if (consistencies.length >= 3 && Math.random() <= 0.5) {
    index = Math.floor(Math.random() * consistencies.length)
    const secondWord = consistencies[index]
    name = `${name}-${secondWord}`
    consistencies.splice(index, 1)
  }
  if (consistencies.length >= 11 && Math.random() <= 0.5) {
    index = Math.floor(Math.random() * consistencies.length)
    const thirdWord = consistencies[index]
    name = `${name}-${thirdWord}`
  }
  return name
}

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
  thingies: state => state.thingies,
  zindices: (state) => {
    const spazeNames = [...new Set(state.thingies.map(thingie => thingie.location))]
    const spzZindexData = {}
    spazeNames.forEach((name) => {
      const indices = state.thingies.filter(thingie => thingie.location === name).map(thingie => thingie.at.z)
      spzZindexData[name] = {
        max: Math.max(...indices),
        min: Math.min(...indices)
      }
    })
    return spzZindexData
  }
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
      console.log('===================== [Store Action: collections/getSpazes]')
      console.log(e)
      return false
    }
  },
  // ////////////////////////////////////////////////////////////////// addSpaze
  addSpaze ({ commit }, spaze) {
    commit('ADD_SPAZE', spaze)
  },
  // /////////////////////////////////////////////////////////// postCreateSpaze
  async postCreateSpaze ({ dispatch, getters, rootGetters }, payload) {
    try {
      const incomingThingieId = payload.incomingThingieId
      const thingie = getters.thingies.find(obj => obj._id === incomingThingieId)
      const existingSpazes = getters.spazes.map(spaze => spaze.name)
      const spazeName = getNewSpazeName(thingie.consistencies)
      if (spazeName && !existingSpazes.includes(spazeName)) {
        const token = rootGetters['pocket/pocket']
        const data = {
          spaze_name: spazeName,
          connections: payload.connections,
          session_token: token,
          creator_thingie: incomingThingieId
        }
        const response = await this.$axiosAuth.post('/post-create-spaze', data)
        return response.data.payload
      }
      console.log('could not name new spaze')
      return false
    } catch (e) {
      console.log('=============== [Store Action: collections/postCreateSpaze]')
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
      console.log('============= [Store Action: collections/postCreateThingie]')
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
      console.log('============= [Store Action: collections/postDeleteThingie]')
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
    state.spazes = spazes
  },
  ADD_SPAZE (state, spaze) {
    state.spazes.push(spaze)
  },
  ADD_THINGIES (state, thingies) {
    state.thingies = thingies
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
