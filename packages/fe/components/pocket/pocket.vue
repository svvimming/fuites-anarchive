<template>
  <div id="pocket-anchor">
    <!-- ===================================================== Pocket Toggle -->
    <Tooltip
      :tooltip="pocketOpen ? 'pocket-toggle-button-open' : 'pocket-toggle-button-closed'"
      :drippy-scene="2"
      contact="top-left"
      class="pocket-toggle-tooltip">

      <ButtonDashed
        :active="pocketOpen"
        :stylized="buttonText"
        :flat-dashes="3"
        :class="['pocket-toggle-button', 'desktop', { active: pocketOpen }]"
        @clicked="pocketStore.setPocketOpen(!pocketOpen)" />

      <ButtonIcon
        :active="pocketOpen"
        :class="['pocket-toggle-button', 'mobile', { active: pocketOpen }]"
        @clicked="pocketStore.setPocketOpen(!pocketOpen)">
        <IconPocket v-if="authenticated" class="icon" />
        <IconKey v-else class="icon" />
      </ButtonIcon>
      
    </Tooltip>

    <div :class="['pocket-container', { open: pocketOpen }, { fullscreen: small }]">
      <!-- ============================================= Background Elements -->
      <Turbulence instance-id="pocket-turbulence-bg" />
       <!-- ===================================================== Token Auth -->
      <Auth
        heading="Token"
        :message="authMessage"
        :class="['auth-modal', { open: !authenticated || tokenInputOpen || !pageExists }]"
        @authenticate-success="handleAuthenticateSuccess"
        @cancel-authentication="handleCancelAuthentication" />
      <!-- ========================================================== Pocket -->
      <div
        v-show="authenticated && pageExists"
        id="pocket">
        <!-- ------------------------------------------------------- spinner -->
        <SpinnerTripleDot v-if="thingies.loading || thingies.refresh" class="theme-cove" />
        <!-- ------------------------------------------------------ uploader -->
        <PocketSingleFileUploader :uploader-id="pocketUploaderId" />
        <!-- ------------------------------------------------ canvas desktop -->
        <PocketCanvas v-if="!small" :pocket-thingies="pocketThingies" />
        <!-- ----------------------------------------------- carousel mobile -->
        <PocketCarousel v-else :pocket-thingies="pocketThingies" />
        <!-- --------------------------------------------------- token input -->
        <Tooltip
          tooltip="token-input-toggle-button"
          class="token-input-toggle">
          <ButtonIcon
            :active="tokenInputOpen"
            class="pocket-button"
            @clicked="tokenInputOpen = !tokenInputOpen">
            <IconKey class="key-icon"/>
          </ButtonIcon>
        </Tooltip>
        <!-- ----------------------------------------------- uploader toggle -->
        <Tooltip
          tooltip="uploader-toggle-button"
          contact="top-right"
          class="uploader-toggle">
          <ButtonIcon
            v-if="pageExists"
            :class="['pocket-button', { 'upload-ready': uploader?.status === 'ready' }]"
            :force-loading="uploader?.status === 'initializing'"
            :force-disabled="uploader?.status === 'uploading'"
            @clicked="pocketStore.toggleUploaderOpen({ id: pocketUploaderId })">
            <IconPlus class="icon" />
          </ButtonIcon>
        </Tooltip>
    
      </div>

    </div>

  </div>
</template>

<script setup>
// ======================================================================== Data
const collectorStore = useCollectorStore()
const { thingies } = storeToRefs(collectorStore)
const generalStore = useGeneralStore()
const { small } = storeToRefs(generalStore)
const verseStore = useVerseStore()
const { page } = storeToRefs(verseStore)
const pocketStore = usePocketStore()
const {
  pocket,
  uploaders,
  authenticated,
  pocketOpen,
} = storeToRefs(pocketStore)

const tokenInputOpen = ref(false)
const buttonText = [
  { letter: 'p', classes: 'source-serif-pro italic semibold' },
  { letter: 'o', classes: 'source-sans-pro bold' },
  { letter: 'c', classes: 'source-serif-pro italic semibold' },
  { letter: 'k', classes: 'source-sans-pro bold italic' },
  { letter: 'e', classes: 'source-serif-pro semibold' },
  { letter: 't', classes: 'source-serif-pro bold italic' }
]
const pocketUploaderId = 'pocket-uploader'

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

const handleCancelAuthentication = () => {
  if (authenticated.value) {
    tokenInputOpen.value = false
  } else {
    pocketStore.setPocketOpen(false)
  }
}

// ======================================================================= Hooks
onMounted(() => {
  // Register the pocket uploader object in the pocket store
  pocketStore.registerUploader(pocketUploaderId)
})

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.pocket-toggle-tooltip {
  z-index: 1000000;
}

.pocket-toggle-button {
  --two-tone-a: #{$billyBlue};
  --two-tone-b: white;
  &.active {
    transform: rotate(15deg);
  }
  &.desktop {
    @include small {
      display: none;
    }
  }
  &.mobile {
    display: none;
    --two-tone-a: #{$billyBlue};
    --two-tone-b: white;
    :deep(path) {
      stroke: var(--two-tone-a);
    }
    &.active {
      transform: none;
      :deep(path) {
        stroke: var(--two-tone-b);
      }
    }
    @include small {
      display: flex;
    }
  }
}

.pocket-container {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 100%;
  height: 100%;
  border-radius: torem(25);
  overflow: hidden;
  z-index: 1;
  opacity: 0;
  visibility: hidden;
  @include modalShadow;
  &.open {
    transition: transform 300ms ease, opacity 300ms ease-out, visibility 300ms linear;
    opacity: 1;
    visibility: visible;
    transform: scale(1);
    width: max(33.9vw, torem(650));
    height: max(20.83vw, torem(400));
    backdrop-filter: blur(10px);
    &.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(#2C2E35, 0.8);
      border-radius: 0;
    }
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
  @include small {
    min-width: torem(300);
  }
}

:deep(.turbulence) {
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  border-radius: torem(25);
  overflow: hidden;
  opacity: 0.85;
  background-color: white;
  @include small {
    display: none;
  }
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
  @include small {
    filter: none;
  }
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
  @include small {
    left: 50%;
    transform: translate(-50%, 0);
  }
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
    path,
    circle {
      transition: 200ms ease;
      fill: $drippyCore;
    }
  }
  .pocket-button {
    &.active {
      :deep(.slot) {
        path,
        circle {
          fill: white;
        }
      }
    }
  }
}

.ghost-image {
  position: fixed;
  left: -9999px;
  overflow: hidden;
}
</style>
