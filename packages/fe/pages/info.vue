<template>
  <div class="info-page">
    <div class="grid">
      <div
        class="col-10_mi-12"
        data-push-left="off-1_mi-0">

        <div class="title">
          <h1>About</h1>
          <SiteLogo />
        </div>

        <div class="markdown-content">
          <p>
            <em>
              The following is an excerpt from our text
              <a href="https://www.architectural-body.com/?p=18190" rel="nofollow">
                A Pool of Pulls: Landing Sites as Propositions for Digital Collective Spaces
              </a>, (2023, 316-317).
            </em>
          </p>
          <p>
            fuit.es is a space for online composition that proposes to bring contrasting elements into play, into relation. Since 2019, it has grown into a transdisciplinary project involving many different artists working to create a space for collective artistic practice. This motivation has stemmed both from the urge to see more shared spaces for online dissemination of art and to develop asynchronous techniques for sparking and proliferating the individual and collective artistic practices of all those involved.
          </p>
          <p>
            The website itself affords a space where traces - images, sounds, text - can be uploaded and worked with as a practice of transversal encounter with other traces from practices in motion within the collective: sculpture, rug-making, music, sound art, video and animation, to name a few. To facilitate such an encounter, is in important that the space give momentum to voices and propositions that don't know that they are asking something yet.
          </p>
          <p>
            As Arakawa and Gins note, it is the architectural surroundings themselves, by the manner that they are crafted, that have the potential to pose questions. They write: “Where one lives needs to become a laboratory for researching, for mapping directly, the living body itself, oneself as world-forming inhabitant” (2002, xxi). Here, world-forming is not an individual act, rather, it is a composing, as much with one's surroundings as collectively. The procedures that come out of these practices should, as suggested by Arakawa and Gins, for that matter be pooled and compared. This pool, this inventory, is what moves us in thinking about digital collective spaces.
          </p>
          <p>
            The question is then: how to build an inventory? Or better: How to craft pulls that allow for new ways of entering and landing into this very inventory so that it can keep rolling and unrolling?
          </p>
          <p>
            We gifted this pool of pulls the name fuites - for its leaks, flights, seepages, passings, outflows.
          </p>
          <h3 id="references">
            <a href="#references">
              References:
            </a>
          </h3>
          <p>
            Gins, Madeline and Arakawa. Architectural Body. Tuscaloosa: The University of Alabama Press. 2002.
          </p>
          <p>
            Matisse A-M, Anouk Hoogendoorn and Ben Muñoz. "A Pool of Pulls: Landing Sites as Propositions for Digital Collective Spaces" Art and Philosophy in the 22nd Century: After Arakawa and Madeline Gins, edited by Naohiko Mimura and Takeshi Kadobayashi, NPO ratik, 2023, pp. 316-320.
          </p>
        </div>

        <div class="sponsors">
          <IconCanadaCouncil class="canada-council-icon" />
          <span>We acknowledge the support of the Canada Council for the Arts.</span>
          <span>Nous remercions le Conseil des arts du Canada de son soutien.</span>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
// ======================================================================= Setup
import SettingsData from '@/data/settings.json'

definePageMeta({ layout: 'empty' })

// ======================================================================== Data
const generalStore = useGeneralStore()

await generalStore.setSiteData({ key: 'settings', value: SettingsData })
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.info-page {
  position: relative;
  padding-top: torem(132);
  overflow: hidden;
  &:before,
  &:after {
    content: '';
    position: absolute;
    left: calc(50% + torem(500));
    top: 0;
    width: torem(1350);
    height: torem(1033);
    transform: translate(-50%, torem(-260));
    z-index: 1;
  }
  &:before {
    background-image: url('/mew.png');
    background-size: cover;
    background-repeat: no-repeat;
    opacity: 0.4;
  }
  &:after {
    background: linear-gradient(97deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 33%, rgba(255,255,255,0) 66%, rgba(255,255,255,1) 100%), linear-gradient(0deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 50%);;
  }
}

.title {
  display: flex;
  position: relative;
  z-index: 2;
  h1 {
    font-size: torem(26);
    font-family: 'Nanum Myeongjo', serif;
    margin-top: torem(15);
    margin-right: torem(8);
  }
  :deep(.site-logo) {
    .letter {
      &:first-child {
        font-family: 'Nanum Myeongjo', serif !important;
      }
    }
  }
}

.markdown-content {
  position: relative;
  z-index: 2;
  padding: torem(80) 0;
  h1 {
    font-size: torem(26);
  }
  a {
    font-weight: 600;
    border-bottom: solid 0.5px rgba($woodsmoke, 0);
    transition: 150ms ease;
    &:hover {
      border-bottom: solid 0.5px rgba($woodsmoke, 1);
    }
  }
  h3 {
    font-size: torem(18);
    margin-top: torem(42);
  }
  h1,
  h3 {
    font-family: 'Nanum Myeongjo', serif;
    margin-bottom: torem(24);
  }
  p {
    font-size: torem(14);
    margin-bottom: torem(16);
    &:first-child {
      margin-bottom: torem(32);
    }
  }
}

.sponsors {
  position: relative;
  z-index: 2;
  padding-bottom: torem(160);
  span {
    display: block;
    font-size: torem(14);
  }
}

.canada-council-icon {
  width: torem(380);
  margin-bottom: torem(24);
}

:deep(.cls-1) {
  fill: #111111;
}
</style>
