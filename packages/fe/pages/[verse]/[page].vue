<template>
  <div ref="page" class="page-container">

    <div class="page">
      <ClientOnly>
        <v-stage :config="{ width: 1000, height: 700 }">
          <v-layer>

            <Thingie
              v-for="thingie in thingies.data"
              :key="thingie._id"
              :thingie="thingie" />

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

const { data } = await useAsyncData(`page-${page}`, async () => {
  await collectorStore.getThingies({ verse, page })
})
</script>

<style lang="scss" scoped>
.page {
  position: relative;
  z-index: 1;
}
</style>
