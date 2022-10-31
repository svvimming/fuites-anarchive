<template>
  <div class="container">

    <Shader
      :throb="0.3">
      <img src="/landing/irridescent.png" width="750" height="1500" />
    </Shader>

  </div>
</template>

<script>
// ====================================================================== Import
import Shader from '@/components/shader'

// ====================================================================== Export
export default {
  name: 'Landing',

  layout: 'landing',

  components: {
    Shader
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.container {
  position: relative;
  width: 100vw;
  height: 100vh;
}
</style>
