<template>
  <div class="super-container viewport">
    <div class="grid-noGutter-noBottom">
      <div class="col">
        <!-- -------------------------------------------------- MAIN CONTENT -->
        <div :class="['page', 'page-container', `view-${view}`]">
          <!-- ================================================== BACKGROUND -->
          <div
            id="page-background"
            :class="['blend', 'z2', 'panel-background', `view-${view}`]">
          </div>
          <div
            id="info-panel-background"
            :class="['panel-background', 'blend', 'z2', { open: view === 'info' }, { hidden: view === 'releases' }]">
          </div>
          <div
            id="releases-panel-background"
            :class="['panel-background', 'blend', 'z2', { open: view === 'releases' }, { hidden: view === 'info' }]">
          </div>
          <!-- =================================================== SITE LOGO -->
          <MusicSiteLogo class="z2" />
          <!-- ================================================= INFO BUTTON -->
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
          <!-- ============================================= RELEASES BUTTON -->
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
          <!-- ====================================================== PANELS -->
          <main :class="['page-content', { z2: view !== 'index' }]">

            <MusicInfoPanel
              :visible="view === 'info'"
              :text="infoText"
              @close-info="view = 'index'" />

            <MusicReleasesPanel
              :visible="view === 'releases'"
              :releases="releases"
              :default-release="featured"
              @close-releases="view = 'index'" />

          </main>

        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
// ======================================================================= Setup
import SettingsData from '@/data/settings.json'
import MusicPageData from '@/data/music.json'

definePageMeta({ layout: 'empty' })

// ======================================================================== Data
const route = useRoute()
const generalStore = useGeneralStore()
const view = ref('index')
const loaded = ref(false)

await generalStore.setSiteData({ key: 'settings', value: SettingsData })

// ==================================================================== Computed
const infoText = computed(() => MusicPageData.info.text)
const releases = computed(() => MusicPageData.releases)
const featured = computed(() => {
  const query = route.query
  const routeRelease = releases.value.find(release => release.slug === query.release)
  return routeRelease?.slug
})

// ======================================================================= Hooks
onMounted(() => {
  // Set the featured release if included in the URL
  if (featured.value) { view.value = 'releases' }
  // Set the page to loaded
  loaded.value = true
})
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
$viewTransitionTime: 800ms;
$panelOffsetTopDesktop: -16rem;
$panelTopPercentageDesktop: 24%;
$panelOffsetTopMobile: -37.5rem;
$panelTopPercentageMobile: 40%;

.super-container {
  min-height: torem(900);
  overflow: hidden;
  background-color: black;
  font-family: 'Fraunces Italic', serif;
  @include small {
    height: 100vh;
    min-height: unset;
  }
  [class~="grid"],
  [class*="grid-"],
  [class*="grid_"] {
    position: relative;
    height: 100%;
    padding: 0 !important;
  }
}

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
  min-height: torem(900);
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
  background-image: url('/music/landing-page-main-bg.png');
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
    background-image: url('/music/landing-page-main-bg.png');
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
  top: calc(torem(-76) + $panelOffsetTopDesktop + $panelTopPercentageDesktop);
  right: 100%;
  width: torem(1053);
  height: torem(1274);
  background-image: url('/music/landing-page-info-bg.png');
  transform: translateX(torem(136)) rotate(-35deg);
  opacity: 1;
  transition: $viewTransitionTime ease;
  @include containerMaxMQ {
    right: calc(66.5% + torem(296));
    transform: translateX(0) rotate(-35deg);
  }
  @include small {
    top: calc(torem(-76) + $panelOffsetTopMobile + $panelTopPercentageMobile);
    transform: translateX(torem(-40)) rotate(-35deg);
  }
  &.open {
    right: 50%;
    top: torem(-291);
    transform: translateX(calc(50% - torem(65))) rotate(-24.5deg);
    @include small {
      top: calc(torem(-291) + $panelOffsetTopMobile + $panelTopPercentageMobile);
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
  right: torem(55);
  width: torem(586);
  height: torem(1080);
  background-image: url('/music/landing-page-releases-bg.png');
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
    height: max(100%, torem(1080));
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
  top: torem(70);
  width: torem(320);
  opacity: 1;
  transition: opacity $viewTransitionTime ease-in-out;
  @include small {
    width: torem(160);
    left: 4%;
    top: torem(45);
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
  top: calc(torem(628) + $panelOffsetTopDesktop + $panelTopPercentageDesktop);
  font-size: torem(21);
  flex-direction: column;
  @include small {
    top: calc(torem(628) + $panelOffsetTopMobile + $panelTopPercentageMobile);
    left: calc(33.5% - 1rem - torem(52));
    font-size: torem(18);
  }
  &.view-info {
    .letter {
      @include climbAnimation(torem(64), torem(34), 0, -14rem);
      @include small {
        @include climbAnimation(torem(34), torem(24), 0, -8rem);
      }
    }
  }
  &.view-index {
    .letter {
      transform: translateY(-14rem);
      margin-bottom: torem(34);
      @include fallAnimation(torem(34), torem(64));
      @include small {
        transform: translateY(-8rem);
        margin-bottom: torem(24);
        @include fallAnimation(torem(24), torem(34));
      }
    }
  }
  &.view-releases {
    opacity: 0;
  }
}

#open-releases {
  right: calc(25.5% - 1rem);
  top: calc(torem(874) - 1rem + $panelOffsetTopDesktop + $panelTopPercentageDesktop);
  transition: 1000ms ease;
  letter-spacing: 1px;
  @include small {
    top: calc(torem(874) - 1rem + $panelOffsetTopMobile + $panelTopPercentageMobile);
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
  margin-bottom: torem(64);
  @include small {
    margin-bottom: torem(34);
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
