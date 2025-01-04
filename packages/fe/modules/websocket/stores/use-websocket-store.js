// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useWebsocketStore = defineStore('websocket', () => {
  // ===================================================================== state
  const socket = ref(null)

  // =================================================================== actions

  /**
   * @method setWebsocketConnection
   * ---------------------------------------------------------------------------
   */

  const setWebsocketConnection = payload => {
    socket.value = payload
    console.log(socket.value)
  }

  // ==================================================================== return
  return {
    // ----- state
    socket,
    // ----- actions
    setWebsocketConnection
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWebsocketStore, import.meta.hot))
}
