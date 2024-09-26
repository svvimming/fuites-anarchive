// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const usePocketStore = defineStore('pocket', () => {
  // ===================================================================== state
  const pocket = ref({})
  const pocketOpen = ref(false)

  // ================================================================== Computed
  const thingies = computed(() => pocket.value.thingies)
  const token = computed(() => pocket.value.token)

  // =================================================================== actions

  /**
   * @method setPocketOpen
   */

  const setPocketOpen = val => {
    pocketOpen.value = val
  }

  /**
   * @method getPocket 
   */

  const getPocket = async token => {
    try {
      const response = await useFetchAuth(`/get-pocket?token=${token}`)
      pocket.value = response
    } catch (e) {
      useHandleFetchError(e)
    }
  }

  /**
   * @method postCreateThingie
   */

  const postCreateThingie = async incoming => {
    try {
      const data = Object.assign({}, incoming, { creator_token: token.value, method: 'post' })
      const thingie = await useFetchAuth('/post-create-thingie', data)
      if (thingie.location === 'pocket') {
        postUpdatePocket({ thingie, action: 'add' })
      }
      return thingie
    } catch (e) {
      useHandleFetchError(e)
      return false
    }
  }

  /**
   * @method postUpdatePocket
   */

  const postUpdatePocket = async incoming => {
    try {
      const thingie = incoming.thingie
      const action = incoming.action
      if (action && token.value === thingie.last_update_token) {
        let updated = []
        // Add a thingie to the pocket
        if (action === 'add' && !thingies.value.includes(thingie._id)) {
          updated = [thingie._id].concat(thingies.value)
        } else {
          throw 'this thingie is already in the pocket!'
        }
        // Remove a thingie from the pocket
        if (action === 'remove' && thingies.value.includes(thingie._id)) {
          updated = thingies.value.filter(id => id !== thingie._id)
        } else {
          throw 'tried to remove a thingie not in the pocket!'
        }
        const response = await useFetchAuth('/post-update-pocket', { token: token.value, thingies: updated  })
        pocket.value = response
      }
    } catch (e) {
      useHandleFetchError(e)
    }
  }

  // ==================================================================== return
  return {
    // ----- state
    pocket,
    pocketOpen,
    // ----- actions
    setPocketOpen,
    getPocket,
    postCreateThingie,
    postUpdatePocket
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePocketStore, import.meta.hot))
}
