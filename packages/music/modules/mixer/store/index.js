// /////////////////////////////////////////////////////////////////////// State
// -----------------------------------------------------------------------------
const state = () => ({
  audioContext: false,
  playState: ''
})

// ///////////////////////////////////////////////////////////////////// Getters
// -----------------------------------------------------------------------------
const getters = {
  audioContext: state => state.audioContext,
  playState: state => state.playState
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
  setAudioContextPlayState ({ commit }, value) {
    commit('SET_AUDIO_CONTEXT_PLAY_STATE', value)
  }
}

// /////////////////////////////////////////////////////////////////// Mutations
// -----------------------------------------------------------------------------
const mutations = {
  CREATE_AUDIO_CONTEXT (state, value) {
    state.audioContext = value
    state.playState = state.audioContext.state
  },
  SET_AUDIO_CONTEXT_PLAY_STATE (state, value) {
    if (state.audioContext) {
      if (value === 'suspended') {
        state.audioContext.resume()
        state.playState = 'running'
      } else if (value === 'running') {
        state.audioContext.suspend()
        state.playState = 'suspended'
      }
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
