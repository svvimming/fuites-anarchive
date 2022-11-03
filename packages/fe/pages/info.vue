<template>
  <div class="container">

    <LandingSite :links="links" />

    <Shader
      id="mew-shader"
      :image="mew"
      :pulse="0.05"
      :exposure="0.5" />

    <div class="grid">

      <div
        class="col-5_md-6_sm-8_mi-10_ti-12"
        data-push-left="off-0_md-1_sm-2">
        <div class="info">
          fuites is an online space for transdisciplinary composition that proposes to bring contrasting elements into play, into relation. It has grown since 2019 into a transdisciplinary project involving many different artists working to create an online space for collective artistic practice. This motivation has stemmed both from the urge to see more shared spaces for online dissemination of art, and to develop asynchronous techniques for sparking and proliferating the individual and collective artistic practices of all those involved. The space itself proposes a transversal encounter of the various practices already in motion within the collective - sculpture, rug-making, music, sound art, video and animation, to name a few.
        </div>
      </div>

      <div
        class="col-4"
        data-push-left="off-1">
        <div class="contact">
          <a
            v-for="contact in contacts"
            :key="contact.text"
            :href="contact.url"
            target="_blank"
            class="external-link">
            {{ contact.text }}
          </a>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
// ====================================================================== Import
import LandingSite from '@/components/landing-site'
import Shader from '@/components/shader'

import LandingSiteData from '@/data/landing.json'

// ====================================================================== Export
export default {
  name: 'InfoPage',

  layout: 'landing',

  components: {
    LandingSite,
    Shader
  },

  data () {
    return {
      mew: {
        src: '/landing/mew.png',
        width: 1700,
        height: 1100
      }
    }
  },

  computed: {
    links () {
      return LandingSiteData.index.links
    },
    contacts () {
      return LandingSiteData.index.contact
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
#mew-shader {
  position: absolute;
  left: calc(50% - #{math.div($containerWidth, 2)} - 700px);
  top: -400px;
  transform: rotate(-30deg);
}

:deep(.landing-site) {
  left: calc(50% - #{math.div($containerWidth, 2)});
}

.info,
.contact {
  padding: 18rem 0;
  position: relative;
}

.contact {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.external-link {
  margin: 0.5rem 0;
  @include link;
  @include linkHover(#000000);
  &:first-child {
    margin-top: 0.25rem;
  }
}
</style>
