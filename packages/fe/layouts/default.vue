<template>
  <div class="verse-container">

    <slot />

    <VerseViewport />

    <Toaster />

  </div>
</template>

<script setup>
// ======================================================================= Setup
if (process.client && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  useHead({
    meta: [
      { name: 'msapplication-config', content: '/favicon/dark/browserconfig.xml' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon/dark/favicon-96x96.png' },
      { rel: 'manifest', href: '/favicon/dark/manifest.json' }
    ]
  })
}

const { $io, $bus } = useNuxtApp()

// ======================================================================== Data

const generalStore = useGeneralStore()
const { sessionId } = storeToRefs(generalStore)
const verseStore = useVerseStore()
const { verse, page } = storeToRefs(verseStore)
const collectorStore = useCollectorStore()
const websocketStore = useWebsocketStore()
const { socket } = storeToRefs(websocketStore)
const keydownEventListener = ref(false)
const keyupEventListener = ref(false)

// ==================================================================== Watchers
watch(() => page.value.data, async () => {
  /**
   * Initialize websocket connection to backend
   */
  if (!socket.value?.connected) {
    await $io.connect()
  }
  /**
   * Add keydown/up event listeners
   */
  if (!keydownEventListener.value) {
    keydownEventListener.value = e => { setDragndropOnShift(e, true) }
    window.addEventListener('keydown', keydownEventListener.value) 
  }
  if (!keyupEventListener.value) {
    keyupEventListener.value = e => { setDragndropOnShift(e, false) }
    window.addEventListener('keyup', keyupEventListener.value)  
  }
})

// ===================================================================== Methods
/**
 * @method handleWebsocketConnected
 */

 const handleWebsocketConnected = socket => {
  const namespace = verse.value.data.name
  socket.emit('join-room', `${namespace}|thingies`)
  socket.emit('join-room', `${namespace}|pages`)
  socket.on('module|update-thingie|payload', (data) => {
    // If the update originated from this session and was updating a thingie 'at'
    // property, don't update in the store - it was already done by the page
    if (data.omit_session_id === sessionId.value) { return }
    collectorStore.updateThingie(data.thingie)
  })
  socket.on('module|post-update-page|payload', (data) => {
    verseStore.updatePage(data.page)
  })
}

/**
 * @method setDragndropOnShift
 */

const setDragndropOnShift = (e, val) => {
  const meta = e.key === 'Meta' || e.code === 'MetaLeft' || e.code === 'MetaRight' || e.keyCode === 91 || e.keyCode === 93
  if (meta) { generalStore.setDragndrop(val) }
}

// ======================================================================= Hooks
// The following is emitted in websocket plugin in websocket zero-core module
$bus.$on('socket.io-connected', handleWebsocketConnected)

onBeforeUnmount(() => {
  $bus.$off('socket.io-connected', handleWebsocketConnected)
  window.removeEventListener('keydown', keydownEventListener.value) 
  window.removeEventListener('keyup', keyupEventListener.value)  
})

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.verse-container {
  position: relative;
  width: 100vw;
  height: 100vh;
}
</style>
