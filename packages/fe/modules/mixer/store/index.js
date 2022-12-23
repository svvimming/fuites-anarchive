// /////////////////////////////////////////////////////////////////////// State
// -----------------------------------------------------------------------------
const state = () => ({
  audioContext: false
})

// ///////////////////////////////////////////////////////////////////// Getters
// -----------------------------------------------------------------------------
const getters = {
  audioContext: state => state.audioContext
}

// ///////////////////////////////////////////////////////////////////// Actions
// -----------------------------------------------------------------------------
const actions = {
  // //////////////////////////////////////////////////////// createAudioContext
  createAudioContext ({ commit }) {
    const audioContext = new AudioContext()
    commit('CREATE_AUDIO_CONTEXT', audioContext)
  },
  // /////////////////////////////////////////////////////////// setAudioContext
  setAudioContext ({ commit }, value) {
    commit('SET_AUDIO_CONTEXT', value)
  }
}

// /////////////////////////////////////////////////////////////////// Mutations
// -----------------------------------------------------------------------------
const mutations = {
  CREATE_AUDIO_CONTEXT (state, value) {
    state.audioContext = value
    console.log(state.audioContext)
  },
  SET_AUDIO_CONTEXT (state, value) {
    if (state.audioContext) {
      if (value === 'suspended') {
        state.audioContext.suspend()
      }
      if (value === 'running') {
        state.audioContext.resume()
      }
    }
    console.log(state.audioContext)
  }
}
