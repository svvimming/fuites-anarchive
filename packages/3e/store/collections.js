// /////////////////////////////////////////////////////////////////// Functions
const getNewPageName = (array) => {
  const consistencies = array.join(' ').split(' ')
  let index = Math.floor(Math.random() * consistencies.length)
  let name = consistencies[index]
  consistencies.splice(index, 1)
  if (consistencies.length >= 3 && Math.random() <= 0.5) {
    index = Math.floor(Math.random() * consistencies.length)
    const secondWord = consistencies[index]
    name = `${name}-${secondWord}`
    consistencies.splice(index, 1)
  }
  if (consistencies.length >= 11 && Math.random() <= 0.5) {
    index = Math.floor(Math.random() * consistencies.length)
    const thirdWord = consistencies[index]
    name = `${name}-${thirdWord}`
  }
  if (!['pocket'].includes(name)) {
    return name
  }
  return false
}

// /////////////////////////////////////////////////////////////////////// State
// -----------------------------------------------------------------------------
const state = () => ({
  pages: [],
  thingies: [],
  editorThingie: false,
  background: ''
})

// ///////////////////////////////////////////////////////////////////// Getters
// -----------------------------------------------------------------------------
const getters = {
  pages: state => state.pages,
  thingies: state => state.thingies,
  editorThingie: state => state.editorThingie,
  background: state => state.background,
  zindices: (state) => {
    const pageNames = [...new Set(state.thingies.map(thingie => thingie.location))]
    const pageZindexData = {}
    pageNames.forEach((name) => {
      const indices = state.thingies.filter(thingie => thingie.location === name).map(thingie => thingie.at.z)
      pageZindexData[name] = {
        max: Math.max(...indices),
        min: Math.min(...indices)
      }
    })
    return pageZindexData
  }
}

// ///////////////////////////////////////////////////////////////////// Actions
// -----------------------------------------------------------------------------
const actions = {
  // ////////////////////////////////////////////////////////////////// getPages
  async getPages ({ commit, getters }) {
    try {
      const response = await this.$axiosAuth.get(`/${this.app.$config.mongoInstance}/get-pages`)
      // console.log(JSON.parse(response.data.payload))
      commit('ADD_PAGES', response.data.payload)
    } catch (e) {
      console.log('===================== [Store Action: collections/getPages]')
      console.log(e)
      return false
    }
  },
  // /////////////////////////////////////////////////////////////////// addPage
  addPage ({ commit }, page) {
    commit('ADD_PAGE', page)
  },
  // //////////////////////////////////////////////////////////// postCreatePage
  async postCreatePage ({ dispatch, getters, rootGetters }, payload) {
    try {
      const thingie = getters.thingies.find(obj => obj._id === payload.creator_thingie)
      const existingPages = getters.pages.map(page => page.name)
      const pageName = payload.page_name ? payload.page_name : getNewPageName(thingie.consistencies)
      if (pageName && !existingPages.includes(pageName)) {
        const pocket = rootGetters['pocket/pocket']
        const props = ['overflow_page', 'creator_thingie']
        const data = {
          page_name: pageName,
          session_token: pocket.token
        }
        props.forEach((prop) => {
          if (payload.hasOwnProperty(prop)) {
            data[prop] = payload[prop]
          }
        })
        const response = await this.$axiosAuth.post(`/${this.app.$config.mongoInstance}/post-create-page`, data)
        return response.data.payload
      }
      console.log('could not name new page')
      return false
    } catch (e) {
      console.log('=============== [Store Action: collections/postCreatePage]')
      console.log(e)
      return false
    }
  },
  // //////////////////////////////////////////////////////////// postUpdatePage
  async postUpdatePage ({ getters }, payload) {
    try {
      const response = await this.$axiosAuth.post(`/${this.app.$config.mongoInstance}/post-update-page`, payload)
      return response.data.payload
    } catch (e) {
      console.log('=============== [Store Action: collections/postUpdatePage]')
      console.log(e)
      return false
    }
  },
  // ////////////////////////////////////////////////// postUpdatePageBackground
  async postUpdatePageBackground ({ dispatch, getters }, payload) {
    try {
      const response = await this.$axiosAuth.post(`/${this.app.$config.mongoInstance}/post-update-background`, payload)
      dispatch('setPageBackground', payload.data_url)
      return response.data.payload
    } catch (e) {
      console.log('====== [Store Action: collections/postUpdatePageBackground]')
      console.log(e)
      return false
    }
  },
  // ///////////////////////////////////////////////////////// getPageBackground
  async getPageBackground ({ dispatch, getters }, payload) {
    try {
      const response = await this.$axiosAuth.get(`/${this.app.$config.mongoInstance}/get-page-background?print=${payload.print_id}`)
      if (response.data.payload && response.data.payload.data_url) {
        dispatch('setPageBackground', response.data.payload.data_url)
      }
      return
    } catch (e) {
      console.log('============= [Store Action: collections/getPageBackground]')
      console.log(e)
      return false
    }
  },
  // ///////////////////////////////////////////////////////// setPageBackground
  setPageBackground ({ commit }, payload) {
    console.log('store set background')
    commit('SET_PAGE_BACKGROUND', { data_url: payload })
  },
  // //////////////////////////////////////////////////////////////// updatePage
  updatePage ({ commit, getters }, incoming) {
    const index = getters.pages.findIndex(obj => obj._id === incoming._id)
    if (index >= 0) {
      commit('UPDATE_PAGE', { index, page: incoming })
    }
  },
  // /////////////////////////////////////////////////////////////// getThingies
  async getThingies ({ commit, getters }, data) {
    try {
      const response = await this.$axiosAuth.get(`/${this.app.$config.mongoInstance}/get-thingies`, {
        params: {
          locations: ['pocket', data.pagename]
        }
      })
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
  async postCreateThingie ({ dispatch, rootGetters }, payload) {
    try {
      const props = ['text', 'fontsize', 'fontfamily', 'colors', 'at', 'pathData', 'width']
      const pocket = rootGetters['pocket/pocket']
      const data = {
        file_id: payload.uploadedFileId,
        location: payload.location,
        creator_token: pocket.token,
        thingie_type: payload.type
      }
      props.forEach((prop) => {
        if (payload.hasOwnProperty(prop)) {
          data[prop] = payload[prop]
        }
      })
      const response = await this.$axiosAuth.post(`/${this.app.$config.mongoInstance}/post-create-thingie`, data)
      const thingie = response.data.payload
      if (thingie.location === 'pocket') { // add thingie id to this client-pocket's thingie list
        const update = { thingie, action: 'add' }
        dispatch('pocket/postUpdatePocket', update, { root: true })
      }
      return thingie
    } catch (e) {
      console.log('============= [Store Action: collections/postCreateThingie]')
      console.log(e)
      return false
    }
  },
  // ///////////////////////////////////////////////////////////// updateThingie
  updateThingie ({ commit, state, getters, dispatch }, incoming) {
    const index = getters.thingies.findIndex(obj => obj._id === incoming._id)
    if (index >= 0) {
      const thingie = state.thingies[index]
      if (thingie.location !== incoming.location) {
        if (thingie.location !== 'pocket' && incoming.location === 'pocket') {
          const update = { thingie: incoming, action: 'add' }
          dispatch('pocket/postUpdatePocket', update, { root: true })
        } else if (thingie.location === 'pocket' && incoming.location !== 'pocket') {
          const update = { thingie: incoming, action: 'remove' }
          dispatch('pocket/postUpdatePocket', update, { root: true })
        }
        if (state.editorThingie) {
          dispatch('collections/clearEditorThingie')
        }
      }
      commit('UPDATE_THINGIE', { index, thingie: incoming })
    }
  },
  // ///////////////////////////////////////////////////////// postDeleteThingie
  async postDeleteThingie ({ dispatch }, payload) {
    try {
      const response = await this.$axiosAuth.post(`/${this.app.$config.mongoInstance}/post-delete-thingie`, {
        thingie_id: payload.id
      })
      return response.data.payload
    } catch (e) {
      console.log('============= [Store Action: collections/postDeleteThingie]')
      console.log(e)
      return false
    }
  },
  // ///////////////////////////////////////////////////////////// removeThingie
  removeThingie ({ commit, getters, dispatch }, thingieId) {
    const index = getters.thingies.findIndex(obj => obj._id === thingieId)
    if (index >= 0) {
      const thingieToRemove = getters.thingies[index]
      if (thingieToRemove.location === 'pocket') {
        dispatch('pocket/postUpdatePocket', { thingie: thingieToRemove, action: 'remove' }, { root: true })
      }
      commit('REMOVE_THINGIE', index)
    }
  },
  // //////////////////////////////////////////////////////////////// clearPages
  clearPages ({ commit, getters}) {
    commit('CLEAR_PAGES')
  },
  // ///////////////////////////////////////////////////////////// clearThingies
  clearThingies ({ commit, getters}) {
    commit('CLEAR_THINGIES')
  },
  // ////////////////////////////////////////////////////////// setEditorThingie
  setEditorThingie ({ commit }, thingie) {
    commit('SET_EDITOR_THINGIE', thingie)
  },
  // //////////////////////////////////////////////////////// clearEditorThingie
  clearEditorThingie ({ commit }) {
    commit('CLEAR_EDITOR_THINGIE')
  },
  // ////////////////////////////////////////////////////////// postCreatePortal
  async postCreatePortal ({ dispatch }, payload) {
    try {
      const vertices = [
        { location: payload.location, at: payload.at },
        { location: payload.destination, at: payload.at }
      ]
      const response = await this.$axiosAuth.post(`/${this.app.$config.mongoInstance}/post-create-portal`, {
        thingieId: payload.closestNeighbour,
        vertices
      })
      const portal = response.data.payload
      return portal
    } catch (e) {
      console.log('============== [Store Action: collections/postCreatePortal]')
      console.log(e)
    }
  }
}

// /////////////////////////////////////////////////////////////////// Mutations
// -----------------------------------------------------------------------------
const mutations = {
  ADD_PAGES (state, pages) {
    state.pages = pages
  },
  ADD_PAGE (state, page) {
    state.pages.push(page)
  },
  UPDATE_PAGE (state, payload) {
    state.pages.splice(payload.index, 1, payload.page)
  },
  CLEAR_PAGES (state) {
    state.pages = []
  },
  ADD_THINGIES (state, thingies) {
    state.thingies = thingies
  },
  ADD_THINGIE (state, thingie) {
    state.thingies.push(thingie)
  },
  UPDATE_THINGIE (state, payload) {
    state.thingies.splice(payload.index, 1, payload.thingie)
  },
  REMOVE_THINGIE (state, index) {
    state.thingies.splice(index, 1)
  },
  CLEAR_THINGIES (state) {
    state.thingies = []
  },
  SET_EDITOR_THINGIE (state, thingie) {
    state.editorThingie = thingie
  },
  CLEAR_EDITOR_THINGIE (state) {
    state.editorThingie = false
  },
  SET_PAGE_BACKGROUND (state, payload) {
    state.background = payload.data_url
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
