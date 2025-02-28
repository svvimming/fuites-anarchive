<template>
  <div id="compost-portal-anchor">
    <!-- ============================================= Compost Portal Toggle -->
    <Tooltip tooltip="compost-portal-toggle-button" contact="top-right" class="compost-portal-tooltip">

      <template #message>
        <span>{{ `Visit the compost anytime at fuit.es/${verseName}/compost to see what is happening in there!` }}</span>
      </template>

      <ButtonStamp
        :active="compostPortalOpen"
        :stylized="buttonText"
        :class="['text-content', { active: compostPortalOpen }]"
        @clicked="compostPortalOpen = !compostPortalOpen" />

    </Tooltip>

    <div :class="['compost-portal-container', { open: compostPortalOpen }]">
      <!-- ============================================= Background Elements -->
      <Turbulence
        instance-id="compost-portal-turbulence-bg"
        :base-x="0.002"
        :base-y="0.005" />
      <!-- ================================================== Compost Portal -->
      <div
        id="compost-portal"
        ref="compostPortalRef"
        :draggable="dragndrop"
        data-location="compost">
        <!-- ----------------------------------------------- Compost Preview -->
        <nuxt-link
          v-if="verseName"
          :to="`/${verseName}/compost`"
          class="compost-link">
          <div class="portal-thingie">
            <div
              class="page-preview">
            </div>
          </div>
        </nuxt-link>
      </div>

    </div>

  </div>
</template>

<script setup>
// ======================================================================== Data
const generalStore = useGeneralStore()
const { dragndrop } = storeToRefs(generalStore)
const verseStore = useVerseStore()
const { verse } = storeToRefs(verseStore)

const compostPortalOpen = ref(false)
const buttonText = [
  { letter: 'c', classes: 'pt-serif italic' },
  { letter: 'o', classes: 'pt-sans bold' },
  { letter: 'm', classes: 'pt-serif italic' },
  { letter: 'p', classes: 'pt-sans bold italic' },
  { letter: 'o', classes: 'pt-serif' },
  { letter: 's', classes: 'pt-serif bold italic' },
  { letter: 't', classes: 'pt-serif italic' }
]

// ==================================================================== Computed
const verseName = computed(() => verse.value.data?.name)

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
:deep(.button.stamp) {
  position: relative;
  z-index: 11;
  padding: 0 1.125rem 0.25rem 1.125rem;
  transition: transform 200ms ease;
  --stamp-color: #{$asparagus};
  &.active {
    transform: scale(1.1) translate(torem(8), torem(-6)) rotate(15deg);
  }
  &:before {
    transform: scaleY(-1);
  }
  .svg-border {
    transform: scaleY(-1);
  }
}

.compost-portal-tooltip {
  z-index: 100000;
  :deep(.tip) {
    min-width: torem(260);
    span {
      &:last-child {
        margin-top: torem(12);
      }
    }
  }
}

.compost-portal-container {
  position: absolute;
  bottom: 0;
  left: 0;
  width: max(33.9vw, torem(650));
  height: max(20.83vw, torem(400));
  border-radius: torem(25);
  overflow: hidden;
  z-index: 1;
  opacity: 0;
  visibility: hidden;
  transform: scale(0.1);
  transform-origin: bottom left;
  transition: transform 300ms ease, opacity 300ms ease-in, visibility 300ms linear, width 400ms ease, height 400ms ease;
  @include modalShadow;
  &.open {
    transition: transform 300ms ease, opacity 300ms ease-out, visibility 300ms linear, width 400ms ease, height 400ms ease;
    opacity: 1;
    visibility: visible;
    transform: scale(1);
  }
}

:deep(.turbulence) {
  width: calc(100% - torem(6));
  height: calc(100% - torem(4));
  top: torem(2);
  left: torem(3);
  border-radius: torem(25);
  overflow: hidden;
  opacity: 0.95;
  background-color: white;
  transform: scaleX(-1);
}

// ////////////////////////////////////////////////////////////////////// Portal
#compost-portal {
  position: relative;
  @include modalShadow;
  width: 100%;
  height: 100%;
}

.compost-link {
  --portal-gradient-start: #ffffff;
  --portal-gradient-stop: #ffffff50;
  --portal-hover-ring: #ffffff80;
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  z-index: 10000;
  user-select: none;
  -webkit-user-drag: none;
  .page-preview {
    filter: drop-shadow(0px 0px 2px var(--portal-gradient-stop));
  }
  .portal-thingie {
    &:before {
      background-color: var(--portal-hover-ring);
      filter: drop-shadow(0 0 0.125rem var(--portal-hover-ring)) drop-shadow(0 0 0.25rem var(--portal-hover-ring));
      opacity: 0;
    }
    &:after {
      background: radial-gradient(circle, var(--portal-gradient-start) 10%, var(--portal-gradient-stop) 30%, rgba(255, 255, 255, 0) 66%);
    }
  }
  &:hover {
    .portal-thingie {
      transform: scale(1.5);
      &:before {
        animation: 2s linear 0s infinite normal forwards running hoverRing;
      }
      &:after {
        transform: scale(1.5);
        background: radial-gradient(circle, var(--portal-gradient-start) 5%, var(--portal-gradient-stop) 20%, rgba(255, 255, 255, 0) 66%);
      }
    }
    .page-preview {
      opacity: 1;
    }
  }
}

.page-preview {
  position: absolute;
  width: 50%;
  height: 50%;
  top: 25%;
  left: 25%;
  background-position: center;
  background-size: 100%;
  background-repeat: no-repeat;
  opacity: 0;
  transition: 300ms ease;
}

.portal-thingie {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  z-index: 2;
  transition: 300ms ease;
  opacity: 0.9;
  &:before,
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: inherit;
    height: inherit;
    border-radius: inherit;
    z-index: 1;
  }
}

@keyframes hoverRing {
  0%, 100% {
    opacity: 0;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
