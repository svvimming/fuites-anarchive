// /////////////////////////////////////////////////////////////////////// State
// -----------------------------------------------------------------------------
const state = () => ({
  sensors: []
})

// ///////////////////////////////////////////////////////////////////// Getters
// -----------------------------------------------------------------------------
const getters = {
  sensors: state => state.sensors
}

// ///////////////////////////////////////////////////////////////////// Actions
// -----------------------------------------------------------------------------
const actions = {
  // ///////////////////////////////////////////////////////// getSensorSettings
  async getSensorSettings ({ commit }) {
    try {
      const response = await this.$axiosAuth.get('/interweave/get-sensor-settings')
      commit('SET_SENSORS', response.data.payload)
    } catch (e) {
      console.log('================== [Store Action: sensor/getSensorSettings]')
      console.log(e)
      return false
    }
  },
  // ////////////////////////////////////////////////// postUpdateSensorSettings
  async postUpdateSensorSettings ({ commit }, payload) {
    try {
      const response = await this.$axiosAuth.post('/interweave/post-update-sensor-settings', payload)
      commit('SET_SENSORS', response.data.payload.updated)
    } catch (e) {
      console.log('=========== [Store Action: sensor/postUpdateSensorSettings]')
      console.log(e)
      return false
    }
  }
}

// /////////////////////////////////////////////////////////////////// Mutations
// -----------------------------------------------------------------------------
const mutations = {
  SET_SENSORS (state, payload) {
    state.sensors = payload
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
