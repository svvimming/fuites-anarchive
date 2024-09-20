<template>
  <div ref="page" class="page-container">
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
const websocketStore = useWebsocketStore()
const { socket } = storeToRefs(websocketStore)

const { data } = await useAsyncData('thingie-params', async () => {
  const content = await queryContent({
    where: {
      _file: { $contains: 'thingie-editable-params.json' }
    }
  }).find()
  return content[0]
})

// ==================================================================== Watchers
watch(data, async () => {
  await collectorStore.getThingies({ verse, page })
  await generalStore.setSiteData({ key: 'thingie-params', value: data.value })
}, { immediate: true })

// ===================================================================== Methods
/**
 * @method initUpdate
 */

const initUpdate = update => {
  // console.log(update)
  socket.value.emit('update-thingie', update)
}
</script>

<style lang="scss" scoped>
.page {
  position: relative;
  z-index: 1;
}
</style>
