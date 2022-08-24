import ImageData from '@/data/test-images.json'
import ThingieData from '@/data/thingie.json'

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
  // ////////////////////////////////////////////////////////// retrieveThingies
  retrieveThingies ({ commit, getters }) {
    const paths = ImageData.images
    const images = []
    paths.forEach((item) => {
      const image = CloneDeep(ThingieData.thingie)
      image.consistency = item.consistency
      image.props.src = item.path
      image.current_location.at = { x: Math.random() * 300, y: Math.random() * 300, z: Math.random() * 300 }
      images.push(image)
    })
    this.dispatch('pocket/addThingies', images)
  },
  // //////////////////////////////////////////////////////////////// addThingie
  addThingies ({ commit, getters }, incoming) {
    const newThingies = Array.isArray(incoming) ? CloneDeep(incoming) : [CloneDeep(incoming)]
    newThingies.forEach((thingie) => {
      thingie.current_location.spaze = 'pocket'
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
    if (state.thingies.length > 5) {
      state.thingies.splice(0, state.thingies.length - 5)
    }
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
