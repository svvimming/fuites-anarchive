<template>
  <div class="container">

    <LandingSite :links="links" />

    <Shader
      id="irridescent-shader"
      :image="irridescent"
      :pulse="0.3"
      :exposure="0.48" />

    <Shader
      id="dots-shader"
      :image="dots"
      :pulse="0.3" />

    <Bingo
      id="alongwalk"
      text="a long walk to somewhere close?"
      :font-size="25"
      :custom="{ fsj: 35 }" />

    <Bingo
      id="absorbing-reflection"
      text="an absorbing relfection"
      :font-size="25"
      :custom="{ fsj: 35 }" />

    <Bingo
      id="reflecting-absorption"
      text="reflecting absorptions of the spills"
      :font-size="30"
      :custom="{ fsj: 35 }" />

    <Scatter
      id="yell-scatter"
      image="/landing/yell.png"
      :ip-width="40" />

    <Scatter
      id="slant-scatter"
      image="/landing/slant.jpg"
      :amount="9"
      :ip-width="40" />

  </div>
</template>

<script>
// ====================================================================== Import
import LandingSite from '@/components/landing-site'
import Shader from '@/components/shader'
import Bingo from '@/components/bingo'
import Scatter from '@/components/scatter'

import LandingSiteData from '@/data/landing.json'

// ====================================================================== Export
export default {
  name: 'Landing',

  layout: 'landing',

  components: {
    LandingSite,
    Shader,
    Bingo,
    Scatter
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
  },

  computed: {
    links () {
      return LandingSiteData.index.links
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

#alongwalk {
  left: 400px;
  top: 500px;
  transform: rotate3d(0, 1, 0, 45deg);
}

#absorbing-reflection {
  left: 270px;
  top: 1300px;
  transform: rotate3d(0.7, 1, 0.2, 45deg);
}

#reflecting-absorption {
  left: 470px;
  top: 2400px;
  transform: rotate3d(-0.2, 1, -0.5, 45deg);
}

#yell-scatter {
  left: 730px;
  top: 440px;
}

#slant-scatter {
  left: 800px;
  top: 1500px;
}
</style>
