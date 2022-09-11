import ImageData from '@/data/test-images.json'
import ThingieData from '@/data/thingie.json'

import CloneDeep from 'lodash/cloneDeep'
// /////////////////////////////////////////////////////////////////////// State
// -----------------------------------------------------------------------------
const state = () => ({
  spazeThingies: [],
  pocketThingies: [],
  compostThingies: []
})

// ///////////////////////////////////////////////////////////////////// Getters
// -----------------------------------------------------------------------------
const getters = {
  spazeThingies: state => state.spazeThingies,
  pocketThingies: state => state.pocketThingies,
  compostThingies: state => state.compostThingies
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
      image.at = { x: Math.random() * 300, y: Math.random() * 300, z: Math.random() * 300 }
      images.push(image)
    })
    this.dispatch('collections/addThingies', { new_location: 'pocket', thingies: images })
  },
  // //////////////////////////////////////////////////////////////// addThingie
  addThingies ({ commit, getters }, incoming) {
    const collection = `${incoming.new_location}Thingies`
    const thingies = incoming.thingies
    const newThingies = Array.isArray(thingies) ? CloneDeep(thingies) : [CloneDeep(thingies)]
    newThingies.forEach((thingie) => {
      thingie.current_location = incoming.new_location
    })
    commit('ADD_THINGIES', {
      collection,
      thingies: newThingies
    })
  },
  // ///////////////////////////////////////////////////////////// updateThingie
  updateThingie ({ commit, getters }, incoming) {
    const collection = `${incoming.current_location}Thingies`
    const consistency = incoming.consistency
    const thingie = CloneDeep(getters[collection].find(obj => obj.consistency === consistency))
    const index = getters[collection].findIndex(obj => obj.consistency === consistency)
    incoming.data.forEach((item) => {
      thingie[item.key] = item.value
    })
    commit('UPDATE_THINGIE', {
      collection,
      thingie,
      index
    })
  },
  // //////////////////////////////////////////////////////////////// addThingie
  moveThingie ({ commit, getters, dispatch }, incoming) {
    console.log(getters)
    const consistency = incoming.consistency
    const collection = `${incoming.current_location}Thingies`
    const thingie = CloneDeep(getters[collection].find(obj => obj.consistency === consistency))
    const index = getters[collection].findIndex(obj => obj.consistency === consistency)
    commit('REMOVE_THINGIE', {
      collection,
      index
    })

    this.dispatch('collections/addThingies', { new_location: incoming.new_location, thingies: thingie })
  }
}

// /////////////////////////////////////////////////////////////////// Mutations
// -----------------------------------------------------------------------------
const mutations = {
  ADD_THINGIES (state, incoming) {
    incoming.thingies.forEach(thingie => {
      state[incoming.collection].push(thingie)
    })
  },
  UPDATE_THINGIE (state, incoming) {
    state[incoming.collection].splice(incoming.index, 1, incoming.thingie)
  },
  REMOVE_THINGIE (state, incoming) {
    state[incoming.collection].splice(incoming.index, 1)
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
