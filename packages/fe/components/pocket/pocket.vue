<template>
  <div class="pocket-anchor">
    <!-- ===================================================== Pocket Toggle -->
    <ButtonText
      :active="pocketOpen"
      text="pocket"
      :class="['text-content color-cove rounded-border-left', { active: pocketOpen }]"
      @clicked="pocketStore.setPocketOpen(!pocketOpen)" />

    <div :class="['pocket-container', { open: pocketOpen }, { fullscreen }]">
      <!-- ============================================= Background Elements -->
      <Turbulence />
      <DashedBorderRectangle class="pocket-border" />

      <!-- ========================================================== Pocket -->
      <div class="pocket">
        <!-- ------------------------------------------------------ uploader -->
        <PocketSingleFileUploader :active="uploaderOpen" />
        <!-- -------------------------------------------- full screen toggle -->
        <ButtonIcon
          class="fullscreen-toggle"
          @clicked="fullscreen = !fullscreen">
          <IconExpand />
        </ButtonIcon>
        <!-- ----------------------------------------------- uploader toggle -->
        <ButtonIcon
          class="uploader-toggle"
          @clicked="uploaderOpen = !uploaderOpen">
          <IconPlus />
        </ButtonIcon>

      </div>

    </div>

  </div>
</template>

<script setup>
// ======================================================================== Data
const pocketStore = usePocketStore()
const { pocketOpen } = storeToRefs(pocketStore)
const fullscreen = ref(false)
const uploaderOpen = ref(false)
// const helpOpen = ref(false)
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.pocket-anchor {
  position: relative;
  margin-left: auto;
}

:deep(.button.stamp) {
  position: relative;
  z-index: 10;
  transition: transform 200ms ease;
  &.active {
    transform: scale(1.1) translate(torem(-8), torem(-6)) rotate(-15deg);
  }
}

.pocket-container {
  position: absolute;
  bottom: 0;
  right: 0;
  width: max(33.9vw, torem(650));
  height: max(20.83vw, torem(400));
  border-radius: torem(25);
  overflow: hidden;
  z-index: 1;
  opacity: 0;
  visibility: hidden;
  transform: scale(0.1);
  transform-origin: bottom right;
  transition: transform 300ms ease, opacity 300ms ease-in, visibility 300ms linear, width 400ms ease, height 400ms ease;
  @include modalShadow;
  &.open {
    transition: transform 300ms ease, opacity 300ms ease-out, visibility 300ms linear;
    opacity: 1;
    visibility: visible;
    transform: scale(1);
  }
  &.fullscreen {
    width: calc(100vw - torem(50));
    height: calc(100vh - torem(50));
  }
}

.pocket-border {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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
}

.pocket {
  position: relative;
  @include modalShadow;
  width: 100%;
  height: 100%;
}

.uploader-toggle {
  position: absolute !important;
  left: torem(12);
  bottom: torem(12);
}

.fullscreen-toggle {
  position: absolute !important;
  left: torem(12);
  top: torem(12);
}
</style>
