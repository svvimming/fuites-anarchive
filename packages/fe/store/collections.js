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
  }
  // // ////////////////////////////////////////////////////////// retrieveThingies
  // retrieveThingies ({ commit, getters }) {
  //   const paths = ImageData.images
  //   const images = []
  //   paths.forEach((item) => {
  //     const image = CloneDeep(ThingieData.thingie)
  //     image.consistency = item.consistency
  //     image.props.src = item.path
  //     image.at = { x: Math.random() * 300, y: Math.random() * 300, z: Math.random() * 300 }
  //     images.push(image)
  //   })
  //   this.dispatch('collections/addThingies', { new_location: 'pocket', thingies: images })
  // },
  // // //////////////////////////////////////////////////////////////// addThingie
  // addThingies ({ commit, getters }, incoming) {
  //   const collection = `${incoming.new_location}Thingies`
  //   const thingies = incoming.thingies
  //   const newThingies = Array.isArray(thingies) ? CloneDeep(thingies) : [CloneDeep(thingies)]
  //   newThingies.forEach((thingie) => {
  //     thingie.current_location = incoming.new_location
  //   })
  //   commit('ADD_THINGIES', {
  //     collection,
  //     thingies: newThingies
  //   })
  // },
  // // ///////////////////////////////////////////////////////////// updateThingie
  // updateThingie ({ commit, getters }, incoming) {
  //   const collection = `${incoming.current_location}Thingies`
  //   const consistency = incoming.consistency
  //   const thingie = CloneDeep(getters[collection].find(obj => obj.consistency === consistency))
  //   const index = getters[collection].findIndex(obj => obj.consistency === consistency)
  //   incoming.data.forEach((item) => {
  //     thingie[item.key] = item.value
  //   })
  //   commit('UPDATE_THINGIE', {
  //     collection,
  //     thingie,
  //     index
  //   })
  // },
  // // //////////////////////////////////////////////////////////////// addThingie
  // moveThingie ({ commit, getters, dispatch }, incoming) {
  //   console.log(getters)
  //   const consistency = incoming.consistency
  //   const collection = `${incoming.current_location}Thingies`
  //   const thingie = CloneDeep(getters[collection].find(obj => obj.consistency === consistency))
  //   const index = getters[collection].findIndex(obj => obj.consistency === consistency)
  //   commit('REMOVE_THINGIE', {
  //     collection,
  //     index
  //   })
  //
  //   this.dispatch('collections/addThingies', { new_location: incoming.new_location, thingies: thingie })
  // }
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
  }
  // ADD_THINGIES (state, incoming) {
  //   incoming.thingies.forEach(thingie => {
  //     state[incoming.collection].push(thingie)
  //   })
  // },
  // UPDATE_THINGIE (state, incoming) {
  //   state[incoming.collection].splice(incoming.index, 1, incoming.thingie)
  // },
  // REMOVE_THINGIE (state, incoming) {
  //   state[incoming.collection].splice(incoming.index, 1)
  // }
}

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export default {
  state,
  getters,
  actions,
  mutations
}
