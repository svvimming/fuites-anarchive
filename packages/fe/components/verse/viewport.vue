<template>
  <div class="verse-viewport">

    <div class="viewport-dock dock-before">

      <LandingSite />

    </div>

    <div class="viewport-dock dock-after">

      <CompostPortal />

      <Pocket />

    </div>

  </div>
</template>

<script setup>

</script>

<style lang="scss" scoped>
.verse-viewport {
  width: 100%;
  height: 100%;
}

.viewport-dock {
  position: absolute;
  width: 100%;
  z-index: 2;
}

.dock-before {
  top: 0;
}

.dock-after {
  bottom: 0;
}
</style>
