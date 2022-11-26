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
          <p>
            <a href="https://fuit.es" class="text-link">fuit.es</a> is a space for online composition that proposes to bring contrasting elements into play, into relation. Since 2019, it has grown into a transdisciplinary project involving many different artists working to create a space for collective artistic practice. This motivation has stemmed both from the urge to see more shared spaces for online dissemination of art and to develop asynchronous techniques for sparking and proliferating the individual and collective artistic practices of all those involved.
          </p>
          <br>
          <p>
            The website itself affords a space where traces - images, sounds, text - can be uploaded and worked with as a practice of transversal encounter with other traces from practices in motion within the collective: sculpture, rug-making, music, sound art, video and animation, to name a few. To faciliate such an encounter, is in important that the space give momentum to voices and propositions that don’t know that they are asking something yet.
          </p>
          <br>
          <p>
            As Arakawa and Gins note, it is the architectural surroundings themselves, by the manner that they are crafted, that have the potential to pose questions. They write: “Where one lives needs to become a laboratory for researching, for mapping directly, the living body itself, oneself as world-forming inhabitant”*. Here, world-forming is not an individual act, rather, it is a composing, as much with one’s surroundings as collectively. The procedures that come out of these practices should, as suggested by Arakawa and Gins, for that matter be pooled and compared. This pool, this inventory, is what moves us in thinking about digital collective spaces.
          </p>
          <br>
          <p>
            The question is then: how to build an inventory? Or better: How to craft pulls that allow for new ways of entering and landing into this very inventory so that it can keep rolling and unrolling?
          </p>
          <br>
          <p>
            We gifted this pool of pulls the name fuites – for its leaks, flights, seepages, passings, outflows.
          </p>
          <br>
          <br>
          <br>
          <p>
            * Arakawa, Shusaku, and Madeline Gins. Architectural Body. Tuscaloosa: The University of Alabama Press. 2002.
          </p>
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

  async fetch ({ app, store }) {
    await store.dispatch('general/setLandingData')
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

.info {
  @include fontSize_Main;
  @include fontWeight_Semibold;
}

.contact {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.external-link,
.text-link {
  @include link;
  @include linkHover(#000000);
}

.external-link {
  margin: 0.5rem 0;
  &:first-child {
    margin-top: 0.25rem;
  }
}
</style>
