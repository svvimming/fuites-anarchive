<template>
  <div class="super-container viewport">

    <div class="grid-noGutter-noBottom">
      <div class="col">
        
        <Nuxt />

      </div>
    </div>
    
  </div>
</template>

<script>
// ====================================================================== Import
// ====================================================================== Export
export default {
  name: 'landing'
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.super-container {
  min-height: toRem(1080);
  overflow: hidden;
  background-color: black;
  @include small {
    height: 100vh;
    min-height: unset;
  }
  [class~="grid"],
  [class*="grid-"],
  [class*="grid_"] {
    position: relative;
    height: 100%;
  }
}
</style>
