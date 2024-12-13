<template>
  <div ref="viewport" class="verse-viewport">

    <VerseModal />

    <VerseHelpMenu />

    <VerseLandingSite />

    <Pocket />

    <CompostPortal v-if="!inCompost" />

    <VerseTextEditor />

    <ClientOnly>
      <Caddy :container="viewport" />
    </ClientOnly>

    <Drippy v-if="activeModes.drippy" />

  </div>
</template>

<script setup>
// ======================================================================== Data
const route = useRoute()
const generalStore = useGeneralStore()
const { activeModes } = storeToRefs(generalStore)

const viewport = ref(null)

const inCompost = computed(() => route.params.page === 'compost')

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.verse-viewport {
  width: 100%;
  height: 100%;
}

:deep(#modal) {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
}

:deep(#landing-site) {
  position: absolute;
  top: torem(25);
  right: torem(25);
  z-index: 2;
}

:deep(#pocket-anchor) {
  position: absolute;
  bottom: torem(25);
  right: torem(25);
  z-index: 2;
}

:deep(#compost-portal-anchor) {
  position: absolute;
  bottom: torem(25);
  left: torem(25);
  z-index: 3;
}
</style>
