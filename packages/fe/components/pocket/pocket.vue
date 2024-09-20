<template>
  <div :class="['pocket-anchor', { open: pocketOpen }]">

    <ButtonStamp
      text="pocket"
      @clicked="pocketStore.setPocketOpen(!pocketOpen)" />

    <div class="pocket-container">

      <Turbulence />

      <div class="pocket">

      </div>

    </div>

  </div>
</template>

<script setup>
const pocketStore = usePocketStore()
const { pocketOpen } = storeToRefs(pocketStore)

watch(pocketOpen, (val) => { console.log(val) })
</script>

<style lang="scss" scoped>
.pocket-anchor {
  position: relative;
}

.pocket-container {
  position: absolute;
  bottom: 0;
  right: 0;
}
</style>
