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
        :key="`info-letter-${i}`"
        :class="['letter', { loaded }]"
        :style="{ 'animation-delay': `${view === 'index' ? (3 - i) * 100 : i * 100}ms` }">
        {{ letter }}
      </span>
    </button>

    <button
      id="open-releases"
      :class="['index-button', 'z2', `view-${view}`]"
      @click="view = 'releases'">
      <span
        v-for="(letter, i) in ['R', 'e', 'l', 'e', 'a', 's', 'e', 's']"
        :key="`releases-letter-${i}`"
        :class="['letter', 'releases', { loaded }]"
        :style="{ 'transition-delay': `${(7 - i) * 100}ms`, '--transition-end': `translate(${(7 - i) * 8}px, ${i * 20}px)` }">
        {{ letter }}
      </span>
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
$panelOffsetTopDesktop: -16rem;
$panelTopPercentageDesktop: 24%;
$panelOffsetTopMobile: -37.5rem;
$panelTopPercentageMobile: 40%;

@mixin climbAnimation($marginStart, $marginEnd, $startY, $endY) {
  animation-name: climb;
  @keyframes climb {
    0% {
      transform: translateY($startY);
      margin-bottom: $marginStart;
    }
    100% {
      transform: translateY($endY);
      margin-bottom: $marginEnd;
    }
  }
}

@mixin fallAnimation($marginStart, $marginEnd) {
  animation-name: fall;
  @keyframes fall {
    0% {
      transform: translateY(-14rem);
      margin-bottom: $marginStart;
    }
    100% {
      transform: translateY(0);
      margin-bottom: $marginEnd;
    }
  }
}

@mixin releasesAnimation($transitionEnd) {
  animation-name: stretch;
  @keyframes stretch {
    0% {
      transform: translate(0, 0);
    }
    100% {
      transform: $transitionEnd;
    }
  }
}

.page-container {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  min-height: toRem(900);
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
        opacity: 0;
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
  top: calc(toRem(-76) + $panelOffsetTopDesktop + $panelTopPercentageDesktop);
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
    top: calc(toRem(-76) + $panelOffsetTopMobile + $panelTopPercentageMobile);
    transform: translateX(toRem(-40)) rotate(-35deg);
  }
  &.open {
    right: 50%;
    top: toRem(-291);
    transform: translateX(calc(50% - toRem(65))) rotate(-24.5deg);
    @include small {
      top: calc(toRem(-291) + $panelOffsetTopMobile + $panelTopPercentageMobile);
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
  top: calc($panelOffsetTopDesktop + $panelTopPercentageDesktop);
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
    top: calc($panelOffsetTopMobile + $panelTopPercentageMobile);
  }
  &.open {
    transform: translate(100%, 0) rotate(0deg);
    height: max(100%, toRem(1080));
    top: 0;
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
  opacity: 1;
  transition: opacity $viewTransitionTime ease-in-out;
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
  transition: 800ms ease, font-weight 200ms ease;
  &:hover {
    font-weight: 700;
  }
}

#open-info {
  left: calc(33.5% - 1rem);
  top: calc(toRem(628) + $panelOffsetTopDesktop + $panelTopPercentageDesktop);
  font-size: toRem(21);
  flex-direction: column;
  @include small {
    top: calc(toRem(628) + $panelOffsetTopMobile + $panelTopPercentageMobile);
    left: calc(33.5% - 1rem - toRem(52));
    font-size: toRem(18);
  }
  &.view-info {
    .letter {
      @include climbAnimation(toRem(64), toRem(34), 0, -14rem);
      @include small {
        @include climbAnimation(toRem(34), toRem(24), 0, -8rem);
      }
    }
  }
  &.view-index {
    .letter {
      transform: translateY(-14rem);
      margin-bottom: toRem(34);
      @include fallAnimation(toRem(34), toRem(64));
      @include small {
        transform: translateY(-8rem);
        margin-bottom: toRem(24);
        @include fallAnimation(toRem(24), toRem(34));
      }
    }
  }
  &.view-releases {
    opacity: 0;
  }
}

#open-releases {
  right: calc(25.5% - 1rem);
  top: calc(toRem(874) - 1rem + $panelOffsetTopDesktop + $panelTopPercentageDesktop);
  transition: 1000ms ease;
  letter-spacing: 1px;
  @include small {
    top: calc(toRem(874) - 1rem + $panelOffsetTopMobile + $panelTopPercentageMobile);
  }
  &.view-releases {
    right: 1rem;
    letter-spacing: 10px;
    @include large {
      right: 0.5rem;
      letter-spacing: 6px;
    }
    @include small {
      opacity: 0.5;
    }
    // @include small {
    //   transition: 1000ms ease;
    //   right: 1rem;
    //   letter-spacing: 1px;
    //   transform: translateY(-100%);
    //   .letter {
    //     transform: var(--transition-end);
    //   }
    // }
  }
  &.view-info {
    opacity: 0;
  }
}

.letter {
  margin-bottom: toRem(64);
  @include small {
    margin-bottom: toRem(34);
  }
  &.loaded {
    animation-fill-mode: forwards;
    animation-iteration-count: 1;
    animation-duration: 500ms;
    animation-timing-function: ease;
    animation-delay: 300ms;
  }
  &.releases {
    --transition-end: translate(0, 0);
    display: inline-block;
    transition: transform 1000ms ease;
  }
}

.button {
  color: white;
}

</style>
