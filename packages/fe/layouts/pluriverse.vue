<template>
  <div class="pluriverse-layout">

    <slot />

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
const pocketStore = usePocketStore()
const { pocketAuth } = storeToRefs(pocketStore)
const verseStore = useVerseStore()

// ==================================================================== Watchers
watch(pocketAuth, async (val) => {
  /**
   * Initialize websocket connection to backend
   */
  if (val) { await $io.connect() }
})

// ===================================================================== Methods
/**
 * @method handleWebsocketConnected
 */

 const handleWebsocketConnected = socket => {
  // Join rooms
  socket.emit('join-room', 'pluriverse')
  // Listen for events
  socket.on('module|post-update-verse|payload', (data) => {
    verseStore.updateVerse(data.verse)
    pocketStore.updatePocketVerses(data.verse)
  })
}


// ======================================================================= Hooks
// The following is emitted in websocket plugin in websocket zero-core module
$bus.$on('socket.io-connected', handleWebsocketConnected)

onBeforeUnmount(() => {
  $bus.$off('socket.io-connected', handleWebsocketConnected)
})
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.pluriverse-layout {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
