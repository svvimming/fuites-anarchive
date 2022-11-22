// ///////////////////////////////////////////////////////// Imports & Variables
// -----------------------------------------------------------------------------
import CloneDeep from 'lodash/cloneDeep'

// /////////////////////////////////////////////////////////////////////// State
// -----------------------------------------------------------------------------
const state = () => ({
  authenticated: true,
  clipboard: false,
  filterValue: '',
  loaders: []
})

// ///////////////////////////////////////////////////////////////////// Getters
// -----------------------------------------------------------------------------
const getters = {
  authenticated: state => state.authenticated,
  clipboard: state => state.clipboard,
  filterValue: state => state.filterValue,
  loaders: state => state.loaders
}

// ///////////////////////////////////////////////////////////////////// Actions
// -----------------------------------------------------------------------------
const actions = {
  // ////////////////////////////////////////////////////////////// setClipboard
  setClipboard ({ commit }, text) {
    this.$addTextToClipboard(text)
    commit('SET_CLIPBOARD', text)
  },
  // //////////////////////////////////////////////////////////// setFilterValue
  setFilterValue ({ commit }, value) {
    commit('SET_FILTER_VALUE', value)
  },
  // ///////////////////////////////////////////////////////////////// addLoader
  addLoader ({ commit, getters }, action) {
    const found = getters.loaders.find(obj => obj === action)
    if (!found) {
      commit('ADD_LOADER', action)
    }
  },
  // ////////////////////////////////////////////////////////////// removeLoader
  removeLoader ({ commit }, action) {
    const loaders = this.getters['general/loaders'].slice()
    const index = loaders.findIndex(obj => obj === action)
    if (index !== -1) {
      commit('REMOVE_LOADER', index)
    }
  },
  // ////////////////////////////////////////////////////////////// authenticate
  async authenticate ({ commit, getters }, token) {
    try {
      const response = await this.$axiosAuth.get('/authenticate', {
        params: { token }
      })
      const authenticated = response.data.payload
      this.$toaster.addToast({
        type: 'toast',
        category: authenticated ? 'success' : 'error',
        message: response.data.message
      })
      commit('SET_AUTHENTICATION_STATUS', authenticated)
    } catch (e) {
      console.log('====================== [Store Action: general/authenticate]')
      console.log(e)
      commit('SET_AUTHENTICATION_STATUS', false)
    }
  }
}

// /////////////////////////////////////////////////////////////////// Mutations
// -----------------------------------------------------------------------------
const mutations = {
  SET_SITE_CONTENT (state, payload) {
    state.siteContent[payload.key] = payload.data
  },
  SET_STATIC_FILE (state, staticFiles) {
    state.staticFiles = staticFiles
  },
  SET_CLIPBOARD (state, text) {
    state.clipboard = text
  },
  SET_FILTER_VALUE (state, value) {
    state.filterValue = value
  },
  ADD_LOADER (state, action) {
    state.loaders.push(action)
  },
  REMOVE_LOADER (state, index) {
    state.loaders.splice(index, 1)
  },
  SET_AUTHENTICATION_STATUS (state, status) {
    state.authenticated = status
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
