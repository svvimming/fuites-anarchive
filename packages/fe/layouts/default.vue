<template>
  <div class="verse-container">

    <slot />

    <VerseViewport />

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
const collectorStore = useCollectorStore()
const generalStore = useGeneralStore()
const { sessionId } = storeToRefs(generalStore)

// ===================================================================== Methods
/**
 * @method handleWebsocketConnected
 */

 const handleWebsocketConnected = socket => {
  socket.emit('join-room', 'thingies')
  socket.on('module|update-thingie|payload', (data) => {
    // If the update originated from this session and was updating a thingie 'at'
    // property, don't update in the store - it was already done by the page
    if (data.omit_session_id === sessionId.value) { return }
    collectorStore.updateThingie(data.thingie)
  })
}

// ======================================================================= Hooks
// The following is emitted in websocket plugin in websocket zero-core module
$bus.$on('socket.io-connected', handleWebsocketConnected)

onMounted(async () => {
  /**
   * Initialize websocket connection to backend
   */
   await $io.connect()
})

onBeforeUnmount(() => {
  $bus.$off('socket.io-connected', handleWebsocketConnected)
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
