import CloneDeep from 'lodash/cloneDeep'
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
  // //////////////////////////////////////////////////////////////// addThingie
  addThingies ({ commit, getters }, incoming) {
    const newThingies = Array.isArray(incoming) ? CloneDeep(incoming) : [CloneDeep(incoming)]
    newThingies.forEach((thingie) => {
      thingie.current_location.spaze = 'spaze'
    })
    commit('ADD_THINGIES', newThingies)
  },
  // ///////////////////////////////////////////////////////////// updateThingie
  updateThingie ({ commit, getters }, incoming) {
    const consistency = incoming.consistency
    const thingie = CloneDeep(getters.thingies.find(obj => obj.consistency === consistency))
    incoming.data.forEach((item) => {
      thingie[item.key] = item.value
    })
    commit('UPDATE_THINGIE', {
      thingie,
      index: getters.thingies.findIndex(obj => obj.consistency === consistency)
    })
  },
  // //////////////////////////////////////////////////////////////// addThingie
  moveThingie ({ commit, getters, dispatch }, incoming) {
    const setter = `${incoming.newLocation}/addThingies`
    const consistency = incoming.consistency
    const thingie = CloneDeep(getters.thingies.find(obj => obj.consistency === consistency))
    this.dispatch(setter, thingie)
    const index = getters.thingies.findIndex(obj => obj.consistency === consistency)
    commit('REMOVE_THINGIE', index)
  }
}

// /////////////////////////////////////////////////////////////////// Mutations
// -----------------------------------------------------------------------------
const mutations = {
  ADD_THINGIES (state, incoming) {
    incoming.forEach(thingie => {
      state.thingies.push(thingie)
    })
  },
  UPDATE_THINGIE (state, incoming) {
    state.thingies.splice(incoming.index, 1, incoming.thingie)
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
