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
  // overflow: hidden;
  &.view-info {
    :deep(#fuites-title) {
      path {
        fill: black;
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
  left: calc(50% - 60vh);
  width: 120vh;
  height: 100vh;
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
    width: calc((100vw - 100vh) * 0.5);
    height: 100vh;
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
    right: calc(50% + 60vh);
    background-position: left center;
  }
  &:after {
    left: calc(50% + 60vh);
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
  &.open {
    right: 50%;
    top: toRem(-291);
    transform: translateX(calc(50% - toRem(65))) rotate(-24.5deg);
  }
  &.hidden {
    transform: translateX(0) rotate(0deg);
  }
}

#releases-panel-background {
  bottom: 0;
  left: 100%;
  width: 45vw;
  height: 120vh;
  background-image: url('/landing/landing-page-releases-bg.png');
  opacity: 1;
  transform: translate(1%, 5.5%) rotate(33.5deg);
  transition: $viewTransitionTime ease;
  background-position: left bottom;
  &.open {
    transform: translate(-45vw, 10vh) rotate(0deg);
  }
  &.hidden {
    transform: translate(30vw, 5.5%) rotate(33.5deg);
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
  width: 320px;
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
  bottom: calc(17.75% - 1rem);
  transition: 1000ms ease;
  letter-spacing: 1px;
  &.view-releases {
    right: 1rem;
    letter-spacing: 10px;
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
