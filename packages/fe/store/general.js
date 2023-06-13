// ///////////////////////////////////////////////////////// Imports & Variables
// -----------------------------------------------------------------------------
import CloneDeep from 'lodash/cloneDeep'
import LandingData from '@/data/landing.json'

// /////////////////////////////////////////////////////////////////////// State
// -----------------------------------------------------------------------------
const state = () => ({
  landing: {},
  authenticated: false,
  clipboard: false,
  filterValue: '',
  loaders: [],
  portalView: true,
  modal: false,
  touchmode: true
})

// ///////////////////////////////////////////////////////////////////// Getters
// -----------------------------------------------------------------------------
const getters = {
  landing: state => state.landing,
  authenticated: state => state.authenticated,
  clipboard: state => state.clipboard,
  filterValue: state => state.filterValue,
  loaders: state => state.loaders,
  portalView: state => state.portalView,
  modal: state => state.modal,
  touchmode: state => state.touchmode
}

// ///////////////////////////////////////////////////////////////////// Actions
// -----------------------------------------------------------------------------
const actions = {
  // //////////////////////////////////////////////////////////// setLandingData
  async setLandingData ({ commit }) {
    commit('SET_LANDING_DATA', { key: 'data', data: LandingData })
  },
  // ////////////////////////////////////////////////////////////// setClipboard
  setClipboard ({ commit }, text) {
    this.$addTextToClipboard(text)
    commit('SET_CLIPBOARD', text)
  },
  // //////////////////////////////////////////////////////////// setFilterValue
  setFilterValue ({ commit }, value) {
    commit('SET_FILTER_VALUE', value)
  },
  // ///////////////////////////////////////////////////////////// setPortalView
  setPortalView ({ commit }, value) {
    commit('SET_PORTAL_VIEW', value)
  },
  // ////////////////////////////////////////////////////////////////// setModal
  setModal ({ commit }, value) {
    commit('SET_MODAL', value)
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
  async authenticate ({ commit, getters, dispatch }, token) {
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
      if (authenticated) {
        dispatch('pocket/getPocket', token, { root: true })
      }
      commit('SET_AUTHENTICATION_STATUS', authenticated)
    } catch (e) {
      console.log('====================== [Store Action: general/authenticate]')
      console.log(e)
      commit('SET_AUTHENTICATION_STATUS', false)
    }
  },
  // ////////////////////////////////////////////////////////////// setTouchMode
  setTouchMode ({ commit }, value) {
    commit('SET_TOUCH_MODE', value)
  }
}

// /////////////////////////////////////////////////////////////////// Mutations
// -----------------------------------------------------------------------------
const mutations = {
  SET_LANDING_DATA (state, payload) {
    state.landing[payload.key] = payload.data
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
  SET_PORTAL_VIEW (state, value) {
    state.portalView = value
  },
  SET_MODAL (state, value) {
    state.modal = value
  },
  ADD_LOADER (state, action) {
    state.loaders.push(action)
  },
  REMOVE_LOADER (state, index) {
    state.loaders.splice(index, 1)
  },
  SET_AUTHENTICATION_STATUS (state, status) {
    state.authenticated = status
  },
  SET_TOUCH_MODE (state, value) {
    state.touchmode = value
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
