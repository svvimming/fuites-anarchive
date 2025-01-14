<template>
  <div id="pocket-anchor">
    <!-- ===================================================== Pocket Toggle -->
    <ButtonStamp
      :active="pocketOpen"
      :stylized="buttonText"
      :class="['text-content', { active: pocketOpen }]"
      @clicked="pocketStore.setPocketOpen(!pocketOpen)" />

    <div :class="['pocket-container', { transform }, { open: pocketOpen }, { fullscreen }]">
      <!-- ============================================= Background Elements -->
      <Turbulence instance-id="pocket-turbulence-bg" />
      <DashedBorderRectangle :inherit-from="pocketRef" @loaded="transform = true" />
       <!-- ===================================================== Token Auth -->
      <Auth
        :message="authMessage"
        :class="['auth-modal', { open: !authenticated || tokenInputOpen || !pageExists }]"
        @authenticate-success="handleAuthenticateSuccess" />
      <!-- ========================================================== Pocket -->
      <div
        v-show="authenticated && pageExists"
        id="pocket"
        ref="pocketRef"
        :draggable="dragndrop"
        data-location="pocket">
        <!-- ------------------------------------------------------- spinner -->
        <SpinnerTripleDot v-if="thingies.loading || thingies.refresh" class="theme-cove" />
        <!-- ------------------------------------------------------ uploader -->
        <PocketSingleFileUploader :uploader-id="pocketUploaderId" />
        <!-- -------------------------------------------------------- canvas -->
        <ClientOnly>
          <v-stage ref="stageRef" :config="{ width: 650, height: 400 }">
            <v-layer>
              <Thingie
                v-for="thingie in pocketThingies"
                :key="thingie._id"
                :thingie="thingie" />
            </v-layer>
          </v-stage>
        </ClientOnly>
        <!-- --------------------------------------------------- token input -->
        <ButtonIcon
          class="pocket-button token-input-toggle"
          :data-tooltip="tokenInputToggleTooltip"
          @clicked="tokenInputOpen = !tokenInputOpen">
          🔑
        </ButtonIcon>
        <!-- -------------------------------------------- full screen toggle -->
        <ButtonIcon
          class="pocket-button fullscreen-toggle"
          @clicked="pocketStore.togglePocketFullscreen()">
          <IconExpand />
        </ButtonIcon>
        <!-- ----------------------------------------------- uploader toggle -->
        <ButtonIcon
          v-if="pageExists"
          :class="['pocket-button', 'uploader-toggle', { 'upload-ready': uploader?.status === 'ready' }]"
          :force-loading="uploader?.status === 'initializing'"
          :force-disabled="uploader?.status === 'uploading'"
          :data-tooltip="uploaderToggleTooltip"
          @clicked="pocketStore.toggleUploaderOpen({ id: pocketUploaderId })">
          <IconPlus :data-tooltip="uploaderToggleTooltip" class="icon" />
        </ButtonIcon>
    
      </div>

    </div>

  </div>
</template>

<script setup>
// ======================================================================== Data
const collectorStore = useCollectorStore()
const { thingies } = storeToRefs(collectorStore)
const generalStore = useGeneralStore()
const { siteData, dragndrop } = storeToRefs(generalStore)
const verseStore = useVerseStore()
const { page } = storeToRefs(verseStore)
const pocketStore = usePocketStore()
const {
  pocket,
  uploaders,
  fullscreen,
  authenticated,
  pocketOpen,
} = storeToRefs(pocketStore)

const transform = ref(false)
const pocketRef = ref(null)
const stageRef = ref(null)
const tokenInputOpen = ref(false)
const buttonText = [
  { letter: 'p', classes: 'pt-serif italic' },
  { letter: 'o', classes: 'pt-sans bold' },
  { letter: 'c', classes: 'pt-serif italic' },
  { letter: 'k', classes: 'pt-sans bold italic' },
  { letter: 'e', classes: 'pt-serif' },
  { letter: 't', classes: 'pt-serif bold italic' }
]
const tokenInputToggleTooltip = ref('')
const uploaderToggleTooltip = ref('')
const pocketUploaderId = 'pocket-uploader'

useHandleThingieDragEvents(pocketRef, stageRef)

// ==================================================================== Computed
const uploader = computed(() => uploaders.value[pocketUploaderId])
const uploaderOpen = computed(() => uploader.value?.open)
const pageExists = computed(() => page.value.data?._id && !page.value.data.doesNotExist)
const pocketThingies = computed(() => thingies.value.data.filter(thingie => thingie.location === 'pocket' && thingie.pocket_ref === pocket.value.data?._id).sort((a, b) => a.zIndex - b.zIndex))
const authMessage = computed(() => {
  if (!pocket.value.authenticated && !authenticated.value) {
    return 'Enter a token below to access your pocket and make changes:'
  } else if (pocket.value.authenticated && authenticated.value) {
    return 'You can add a new token below:'
  } else {
    return 'You don\'t have access to this Verse. Trying adding a token that belongs to this Verse below:'
  }
})

// ==================================================================== Watchers
watch(uploaderOpen, (val) => {
  if (val) { tokenInputOpen.value = false }
})

// ===================================================================== Methods
const handleAuthenticateSuccess = () => {
  collectorStore.getThingies()
  if (!pageExists.value) {
    pocketStore.setPocketOpen(false)
  } else {
    tokenInputOpen.value = false
  }
}

// ======================================================================= Hooks
onMounted(() => {
  // Set component tooltips
  tokenInputToggleTooltip.value = siteData.value?.settings?.tooltips['token-input-toggle-button']
  uploaderToggleTooltip.value = siteData.value?.settings?.tooltips['uploader-toggle-button']
  // Register the pocket uploader object in the pocket store
  pocketStore.registerUploader(pocketUploaderId)
})

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
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
  @include modalShadow;
  &.transform {
    transform: scale(0.1);
    transform-origin: bottom right;
    transition: transform 300ms ease, opacity 300ms ease-in, visibility 300ms linear, width 400ms ease, height 400ms ease;
  }
  &.open {
    transition: transform 300ms ease, opacity 300ms ease-out, visibility 300ms linear, width 400ms ease, height 400ms ease;
    opacity: 1;
    visibility: visible;
    transform: scale(1);
  }
  &.fullscreen {
    width: calc(100vw - torem(50));
    height: calc(100vh - torem(50));
  }
}

.auth-modal {
  position: absolute;
  top: 50%;
  left: 50%;
  visibility: hidden;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8);
  transition: 300ms ease;
  z-index: 2;
  &.open {
    visibility: visible;
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

:deep(.turbulence) {
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  border-radius: torem(25);
  overflow: hidden;
  opacity: 0.95;
  background-color: white;
}

:deep(.svg-border-rectangle) {
  rect {
    stroke: $cove;
    rx: 24;
  }
}

// ---------------------------------------------------------------------- Pocket
#pocket {
  position: relative;
  @include modalShadow;
  width: 100%;
  height: 100%;
}

:deep(.triple-dot-loader) {
  position: absolute;
  top: 0;
  left: 50%;
  z-index: 99;
  transform: translate(-50%, 2rem);
}

:deep(.icon-button) {
  --two-tone-a: #{$cove};
  --two-tone-b: white;
}

.pocket-button {
  filter: none !important;
}

.uploader-toggle {
  position: absolute !important;
  left: torem(12);
  bottom: torem(12);
  z-index: 101;
  .icon {
    transition: 150ms ease;
  }
  :deep(.spinner) {
    circle {
      stroke-width: 10;
      stroke: $cove;
    }
  }
  &.upload-ready {
    .icon {
      transform: rotate(45deg);
    }
  }
}

.fullscreen-toggle {
  position: absolute !important;
  left: torem(12);
  top: torem(12);
  z-index: 101;
}

.token-input-toggle {
  position: absolute !important;
  right: torem(12);
  top: torem(12);
  z-index: 99;
  :deep(.slot) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.ghost-image {
  position: fixed;
  left: -9999px;
  overflow: hidden;
}
</style>
