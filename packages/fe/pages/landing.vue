<template>
  <div class="container">

    <Shader
      id="irridescent-shader"
      :image="irridescent"
      :pulse="0.3"
      :exposure="0.5" />

    <Shader
      id="dots-shader"
      :image="dots"
      :pulse="0.3" />

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
  },

  data () {
    return {
      irridescent: {
        src: '/landing/irridescent.png',
        width: 750,
        height: 1500
      },
      dots: {
        src: '/landing/dots.png',
        width: 972,
        height: 1600
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
}

#irridescent-shader {
  position: absolute;
  top: 0;
  left: 0;
}

#dots-shader {
  position: absolute;
  left: 500px;
  top: 1400px;
}
</style>
