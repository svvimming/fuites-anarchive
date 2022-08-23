import ImageData from '@/data/image-paths.json'
import ThingieTypes from '@/data/thingies.json'

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
    const paths = ImageData.paths
    const images = []
    paths.forEach((path) => {
      const image = CloneDeep(ThingieTypes.image_thingie)
      image.props.src = path
      images.push(image)
    })
    this.dispatch('pocket/addThingies', images)
  },
  // //////////////////////////////////////////////////////////////// addThingie
  addThingies ({ commit, getters }, incoming) {
    const newThingies = Array.isArray(incoming) ? incoming : [incoming]
    commit('ADD_THINGIES', newThingies)
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
