<template>
  <div class="page-container">
    <div class="page">
      <ClientOnly>
        <v-stage :config="{ width: 1000, height: 700 }">
          <v-layer>

            <Thingie
              v-for="thingie in thingies.data"
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
const verse = route.params.verse
const page = route.params.page

const collectorStore = useCollectorStore()
const { thingies } = storeToRefs(collectorStore)
const generalStore = useGeneralStore()
const { sessionId } = storeToRefs(generalStore)
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

// ==================================================================== Watchers
watch(data, async () => {
  await collectorStore.getThingies({ verse, page })
  await generalStore.setSiteData({ key: 'settings', value: data.value })
}, { immediate: true })

// ===================================================================== Methods
/**
 * @method initUpdate
 */

const initUpdate = update => {
  // If updating the at property, record the session id into the update
  // Manipulate the thingie directly in the store rather than wait for the network
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
