<template>
  <div class="verses-overview">
    <div v-if="!authenticated">
      Add Token
    </div>
    <div v-else>
      hi
    </div>
  </div>
</template>

<script setup>
// ======================================================================== Data
const route = useRoute()
const generalStore = useGeneralStore()
const pocketStore = usePocketStore()
const { pocket, authenticated } = storeToRefs(pocketStore)

const { data } = await useAsyncData(route.fullPath, async () => {
  const content = await queryContent({
    where: {
      _file: { $contains: 'settings.json' }
    }
  }).find()
  return content[0]
})

// ==================================================================== Watchers
watch(data, async () => {
  // const vrs = route.params.verse
  await generalStore.setSiteData({ key: 'settings', value: data.value })
}, { immediate: true })

</script>
