<template>
  <div ref="viewport" class="verse-viewport">
    <!-- --------------------------------------------------------- To Verses -->
    <ButtonIcon
      tag="nuxt-link"
      to="/verses"
      class="to-multiverse">
      <IconCompass class="icon"/>
    </ButtonIcon>
    <!-- ------------------------------------------------------ Page Creator -->
    <VersePageCreator />
    <!-- ----------------------------------------------------- Landing Sites -->
    <VerseLandingSites />
    <!-- ------------------------------------------------------------ Pocket -->
    <Pocket />
    <!-- ---------------------------------------------------- Compost Portal -->
    <CompostPortal v-if="!inCompost" />
    <!-- ------------------------------------------------------- Text Editor -->
    <VerseTextEditor />
    <!-- ------------------------------------------------------------- Caddy -->
    <ClientOnly><Caddy :container="viewport" /></ClientOnly>
    <!-- ------------------------------------------------------------ Drippy -->
    <Drippy v-if="activeModes.drippy" />

  </div>
</template>

<script setup>
// ======================================================================== Data
const route = useRoute()
const generalStore = useGeneralStore()
const { activeModes } = storeToRefs(generalStore)
const viewport = ref(null)

// ==================================================================== Computed
const inCompost = computed(() => route.params.page === 'compost')

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.verse-viewport {
  width: 100%;
  height: 100%;
}

:deep(.to-multiverse) {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  top: torem(25);
  left: torem(25);
  z-index: 2;
  --two-tone-a: #{$blueHaze};
  --two-tone-b: white;
  .icon {
    width: torem(20);
    height: torem(20);
    path {
      stroke: $blueHaze;
    }
  }
}

:deep(#landing-site-anchor) {
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
