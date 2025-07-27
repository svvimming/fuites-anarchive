<template>
  <div :class="['verse-container', { 'drag-n-drop-event': draggingThingie }]">

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
const { sessionId, draggingThingie } = storeToRefs(generalStore)
const verseStore = useVerseStore()
const { verse, page } = storeToRefs(verseStore)
const pocketStore = usePocketStore()
const collectorStore = useCollectorStore()
const websocketStore = useWebsocketStore()
const { socket } = storeToRefs(websocketStore)
const keydownEventListener = ref(false)
const keyupEventListener = ref(false)
const doubleClickEventListener = ref(false)

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
    keydownEventListener.value = e => { setInteractionModes(e, true) }
    window.addEventListener('keydown', keydownEventListener.value) 
  }
  if (!keyupEventListener.value) {
    keyupEventListener.value = e => { setInteractionModes(e, false) }
    window.addEventListener('keyup', keyupEventListener.value)  
  }
})

// ===================================================================== Methods
/**
 * @method handleWebsocketConnected
 */

 const handleWebsocketConnected = socket => {
  const namespace = verse.value.data.name
  // Join rooms
  socket.emit('join-room', `${namespace}|thingies`)
  socket.emit('join-room', `${namespace}|pages`)
  socket.emit('join-room', `${namespace}|portals`)
  socket.emit('join-room', 'multiverse')
  // Listen for events
  socket.on('module|update-thingie|payload', (data) => {
    // If the update originated from this session and was updating a thingie 'at'
    // property, don't update in the store - it was already done by the page
    if (data.omit_session_id === sessionId.value) { return }
    collectorStore.updateThingie(data.thingie)
  })
  socket.on('module|post-create-thingie|payload', (data) => {
    collectorStore.pushCreatedThingie(data)
  })
  socket.on('module|post-delete-thingie|payload', (data) => {
    collectorStore.popDeletedThingie(data)
  })
  socket.on('module|post-update-page|payload', (data) => {
    verseStore.updatePage(data.page)
  })
  socket.on('module|post-update-verse|payload', (data) => {
    verseStore.updateVerse(data.verse)
    pocketStore.updatePocketVerses(data.verse)
  })
  socket.on('module|update-portal|payload', (data) => {
    // If the update originated from this session, ignore
    if (data.omit_session_id === sessionId.value) { return }
    verseStore.updatePortal(data.portal)
  })
}

/**
 * @method setInteractionModes
 */

const setInteractionModes = (e, val) => {
  const drag = e.key === 'd' || e.code === 'KeyD' || e.keyCode === 68
  if (drag) { generalStore.setDragndrop(val) }
  const shift = e.key === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.keyCode === 16
  if (shift) { generalStore.setPortalEditing(val) }
}

// ======================================================================= Hooks
// The following is emitted in websocket plugin in websocket zero-core module
$bus.$on('socket.io-connected', handleWebsocketConnected)

onMounted(() => {
  // Prevent browser zoom on double clicks
  doubleClickEventListener.value = e => { e.preventDefault() }
  window.addEventListener('dblclick', doubleClickEventListener.value)
})

onBeforeUnmount(() => {
  $bus.$off('socket.io-connected', handleWebsocketConnected)
  if (keydownEventListener.value) {
    window.removeEventListener('keydown', keydownEventListener.value)
  }
  if (keyupEventListener.value) {
    window.removeEventListener('keyup', keyupEventListener.value)
  }
  if (doubleClickEventListener.value) {
    window.removeEventListener('dblclick', doubleClickEventListener.value)
  }
})

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.verse-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  &.drag-n-drop-event {
    cursor: copy !important;
  }
  @include small {
    height: 100svh;
  }
}
</style>
