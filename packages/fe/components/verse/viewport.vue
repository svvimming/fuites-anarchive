<template>
  <div ref="viewport" class="verse-viewport">

    <VerseModal />

    <VerseHelpMenu />

    <VerseLandingSite />

    <CompostPortal />

    <Pocket />

    <VerseTextEditor />

    <Caddy :container="viewport" />

  </div>
</template>

<script setup>
// ======================================================================== Data
const viewport = ref(null)
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
</style>
