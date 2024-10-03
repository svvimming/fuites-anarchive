<template>
  <div class="page-container">
    <!-- ============================================================== Page -->
    <div ref="pageRef" :draggable="dragndrop" class="page">
      <ClientOnly>
        <v-stage ref="stageRef" :config="{ width: 1000, height: 700 }">
          <v-layer>
            <Thingie
              v-for="thingie in pageThingies"
              :key="thingie._id"
              :thingie="thingie"
              @init-update="initUpdate" />
          </v-layer>
        </v-stage>
      </ClientOnly>
    </div>

  </div>
</template>

<script setup>
// ======================================================================== Data
const route = useRoute()
const verseStore = useVerseStore()
// const { verse } = storeToRefs(verseStore)
const collectorStore = useCollectorStore()
const { thingies } = storeToRefs(collectorStore)
const generalStore = useGeneralStore()
const { sessionId, dragndrop } = storeToRefs(generalStore)
const websocketStore = useWebsocketStore()
const { socket } = storeToRefs(websocketStore)

const { data } = await useAsyncData('settings', async () => {
  const content = await queryContent({
    where: {
      _file: { $contains: 'settings.json' }
    }
  }).find()
  return content[0]
})

const pageRef = ref(false)
const stageRef = ref(false)

useHandleThingieDragEvents(pageRef, stageRef)

// ==================================================================== Computed
const verseName = computed(() => route.params.verse)
const pageName = computed(() => route.params.page)
const pageThingies = computed(() => thingies.value.data.filter(thingie => thingie.location === pageName.value))

// ==================================================================== Watchers
watch(data, async () => {
  await verseStore.getVerse({ verse: verseName.value })
  await verseStore.getPage({ page: pageName.value })
  await generalStore.setSiteData({ key: 'settings', value: data.value })
  await collectorStore.getThingies()
}, { immediate: true })

// ===================================================================== Methods
/**
 * @method initUpdate
 * @desc Emits a thinige update to the 'thingies' room using the websocket store socket. If updating the `at` property, the session id is recorded into the update and the thingie is also directly updated in the store rather than waiting for a response over the network.
 */

const initUpdate = update => {
  if (update.hasOwnProperty('at')) {
    const updateAt = Object.assign({}, update, { omit_session_id: sessionId.value })
    socket.value.emit('update-thingie', updateAt)
    collectorStore.updateThingie(updateAt)
  } else {
    socket.value.emit('update-thingie', update)
  }
}
</script>

<style lang="scss" scoped>
.page-container {
  position: absolute;
  top: 0;
  left: 0;
}

.page {
  position: relative;
  z-index: 1;
}
</style>
