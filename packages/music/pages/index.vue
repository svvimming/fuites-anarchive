<template>
  <div :class="['page', 'page-container', `view-${view}`]">

    <div
      id="page-background"
      :class="['blend', 'z2', 'panel-background', `view-${view}`]">
    </div>

    <button
      id="open-info"
      :class="['index-button', 'z2', `view-${view}`]"
      @click="view = 'info'">
      <span
        v-for="(letter, i) in ['i', 'n', 'f', 'o']"
        :key="letter"
        :class="['letter', { loaded }]"
        :style="{ 'animation-delay': `${view === 'index' ? (3 - i) * 100 : i * 100}ms` }">
        {{ letter }}
      </span>
    </button>

    <button
      id="open-releases"
      :class="['index-button', 'z2', `view-${view}`]"
      @click="view = 'releases'">
      Releases
    </button>

    <div
      id="info-panel-background"
      :class="['panel-background', 'blend', 'z2', { open: view === 'info' }, { hidden: view === 'releases' }]">
    </div>

    <div
      id="releases-panel-background"
      :class="['panel-background', 'blend', 'z2', { open: view === 'releases' }, { hidden: view === 'info' }]">
    </div>

    <SiteLogo class="z2" />

    <main :class="['page-content', { z2: view !== 'index' }]">

      <InfoPanel
        :visible="view === 'info'"
        :text="infoText"
        @close-info="view = 'index'" />

      <ReleasesPanel
        :visible="view === 'releases'"
        :releases="releases"
        @close-releases="view = 'index'" />

    </main>

  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters } from 'vuex'
import SiteLogo from '@/components/site-logo'
import InfoPanel from '@/components/info-panel'
import ReleasesPanel from '@/components/releases-panel'

// ====================================================================== Export
export default {
  name: 'Landing',

  layout: 'landing',

  components: {
    SiteLogo,
    InfoPanel,
    ReleasesPanel
  },

  data () {
    return {
      view: 'index',
      loaded: false
    }
  },

  async fetch ({ app, store }) {
    await store.dispatch('general/setLandingData')
  },

  computed: {
    ...mapGetters({
      landing: 'general/landing'
    }),
    infoText () {
      return this.landing.data.index.info.text
    },
    releases () {
      return this.landing.data.index.releases
    }
  },

  mounted () {
    this.loaded = true
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
$viewTransitionTime: 800ms;

.page-container {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  min-height: toRem(1080);
  // overflow: hidden;
  @include small {
    height: 100vh;
    min-height: unset;
  }
  &.view-info {
    :deep(#fuites-title) {
      path {
        fill: black;
      }
    }
  }
  &.view-releases {
    @include small {
      :deep(#fuites-title) {
        path {
          fill: black;
        }
      }
    }
  }
}

.z2 {
  z-index: 2 !important;
}

.blend {
  mix-blend-mode: exclusion;
}

.panel-background {
  position: absolute;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
}

#page-background {
  top: 0;
  left: -10%;
  width: 120%;
  height: 100%;
  background-image: url('/landing/landing-page-main-bg.png');
  transition: transform 1200ms ease;
  @include containerMaxMQ {
    left: 0;
    width: 100%;
    height: 100%;
  }
  &.view-releases {
    transform: scaleX(1.15) translateX(6.5%);
  }
  &.view-info {
    transform: scaleX(1.05) translateX(-2%);
  }
  &:before,
  &:after {
    content: '';
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    background-image: url('/landing/landing-page-main-bg.png');
    background-size: cover;
    background-repeat: no-repeat;
    transform: scaleX(-1);
    z-index: 1;
    @include containerMaxMQ {
      display: none;
    }
  }
  &:before {
    right: 100%;
    background-position: left center;
  }
  &:after {
    left: 100%;
    background-position: right center;
  }
}

#info-panel-background {
  top: toRem(-76);
  right: 100%;
  width: toRem(1053);
  height: toRem(1274);
  background-image: url('/landing/landing-page-info-bg.png');
  transform: translateX(toRem(136)) rotate(-35deg);
  opacity: 1;
  transition: $viewTransitionTime ease;
  @include containerMaxMQ {
    right: calc(66.5% + toRem(296));
    transform: translateX(0) rotate(-35deg);
  }
  @include small {
    top: calc(toRem(-76) + $panelOffsetTopMobile);
  }
  &.open {
    right: 50%;
    top: toRem(-291);
    transform: translateX(calc(50% - toRem(65))) rotate(-24.5deg);
    @include small {
      top: calc(toRem(-291) + $panelOffsetTopMobile);
    }
  }
  &.hidden {
    transform: translateX(0) rotate(0deg);
    right: calc(50% + 50vw);
    @include containerMaxMQ {
      right: 100%;
    }
  }
}

#releases-panel-background {
  top: 0;
  right: toRem(55);
  width: toRem(586);
  height: toRem(1080);
  background-image: url('/landing/landing-page-releases-bg.png');
  opacity: 1;
  transform: translate(100%, 5.5%) rotate(33.5deg);
  transition: $viewTransitionTime ease;
  background-position: left bottom;
  @include containerMaxMQ {
    right: calc(25.5% - 16.5rem);
    transform: translate(100%, 3.5rem) rotate(33.5deg);
  }
  @include small {
    top: $panelOffsetTopMobile;
  }
  &.open {
    transform: translate(100%, 0) rotate(0deg);
    height: max(100%, toRem(1080));
    right: 45%;
    width: 50vw;
    @include containerMaxMQ {
      width: 45%;
      right: 45%;
    }
    @include medium {
      width: 50%;
      right: 50%;
    }
    @include small {
      top: 0;
      width: 100%;
      right: 100%;
    }
  }
  &.hidden {
    right: calc(50% - 50vw);
    transform: translate(100%, 5.5%) rotate(0);
  }
}

.page-content {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 1;
}

:deep(#fuites-title) {
  position: absolute;
  left: 7%;
  top: toRem(70);
  width: toRem(320);
  @include small {
    width: toRem(160);
    left: 4%;
    top: toRem(45);
  }
  path {
    transition: $viewTransitionTime ease-in-out;
    fill: white;
  }
}

.index-button {
  position: absolute;
  display: flex;
  line-height: 1;
  padding: 1rem;
  color: white;
  opacity: 1;
  transition: 800ms ease;
}

#open-info {
  left: calc(33.5% - 1rem);
  top: toRem(628);
  font-size: toRem(21);
  flex-direction: column;
  @include small {
    top: calc(toRem(628) + $panelOffsetTopMobile);
  }
  &.view-info {
    .letter {
      animation-name: climb;
    }
  }
  &.view-index {
    .letter {
      animation-name: fall;
    }
  }
  &.view-releases {
    opacity: 0;
  }
}

#open-releases {
  right: calc(25.5% - 1rem);
  top: calc(toRem(874) - 1rem);
  transition: 1000ms ease;
  letter-spacing: 1px;
  @include small {
    top: calc(toRem(874) - 1rem + $panelOffsetTopMobile);
  }
  &.view-releases {
    right: 1rem;
    letter-spacing: 10px;
    @include large {
      right: 0.5rem;
      letter-spacing: 6px;
    }
    @include small {
      transform: translateX(100%);
      right: calc(100% - 1rem);
      letter-spacing: 10px;
    }
    @include mini {
      right: calc(100% - 0.5rem);
      letter-spacing: 1px;
    }
  }
  &.view-info {
    opacity: 0;
  }
}

.letter {
  margin-bottom: toRem(70);
  &.loaded {
    animation-fill-mode: forwards;
    animation-iteration-count: 1;
    animation-duration: 500ms;
    animation-timing-function: ease;
    animation-delay: 300ms;
  }
}

.button {
  color: white;
}

@keyframes climb {
  0% {
    transform: translateY(0);
    margin-bottom: toRem(70);
  }
  100% {
    transform: translateY(-14rem);
    margin-bottom: toRem(34);
  }
}

@keyframes fall {
  0% {
    transform: translateY(-14rem);
    margin-bottom: toRem(34);
  }
  100% {
    transform: translateY(0);
    margin-bottom: toRem(70);
  }
}

</style>
