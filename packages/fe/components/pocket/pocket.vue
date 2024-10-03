<template>
  <div id="pocket-anchor">
    <!-- ===================================================== Pocket Toggle -->
    <ButtonText
      v-if="authenticated"
      :active="pocketOpen"
      text="pocket"
      :class="['text-content color-cove rounded-border-left', { active: pocketOpen }]"
      @clicked="pocketStore.setPocketOpen(!pocketOpen)" />

    <div :class="['pocket-container', { open: pocketOpen }, { fullscreen }]">
      <!-- ============================================= Background Elements -->
      <Turbulence />
      <!-- <DashedBorderRectangle class="pocket-border" /> -->
      <!-- ========================================================== Pocket -->
      <div id="pocket" ref="pocketRef" :draggable="dragndrop">
        <!-- ------------------------------------------------------- spinner -->
        <SpinnerTripleDot v-if="thingies.loading || thingies.refresh" class="theme-cove" />
        <!-- ------------------------------------------------------ uploader -->
        <PocketSingleFileUploader />
        <!-- -------------------------------------------------------- canvas -->
        <ClientOnly>
          <v-stage ref="stageRef" :config="{ width: 650, height: 400 }">
            <v-layer>
              <Thingie
                v-for="thingie in pocketThingies"
                :key="thingie._id"
                :thingie="thingie"
                @init-update="initUpdate" />
            </v-layer>
          </v-stage>
        </ClientOnly>
        <!-- -------------------------------------------- full screen toggle -->
        <ButtonIcon
          class="fullscreen-toggle"
          @clicked="pocketStore.togglePocketFullscreen()">
          <IconExpand />
        </ButtonIcon>
        <!-- ----------------------------------------------- uploader toggle -->
        <ButtonIcon
          :class="['uploader-toggle', { 'upload-ready': uploader.status === 'ready' }]"
          :force-loading="uploader.status === 'initialized'"
          :force-disabled="uploader.status === 'uploading'"
          @clicked="pocketStore.setUploaderOpen(!uploaderOpen)">
          <IconPlus class="icon" />
        </ButtonIcon>
    
      </div>

    </div>

  </div>
</template>

<script setup>
// ======================================================================== Data
const collectorStore = useCollectorStore()
const { thingies } = storeToRefs(collectorStore)
const websocketStore = useWebsocketStore()
const { socket } = storeToRefs(websocketStore)
const generalStore = useGeneralStore()
const { sessionId, dragndrop } = storeToRefs(generalStore)
const pocketStore = usePocketStore()
const {
  pocket,
  uploader,
  fullscreen,
  authenticated,
  pocketOpen,
  uploaderOpen,
} = storeToRefs(pocketStore)

const pocketRef = ref(null)
const stageRef = ref(null)

useHandleThingieDragEvents(pocketRef, stageRef)

// ==================================================================== Computed
const pocketThingies = computed(() => thingies.value.data.filter(thingie => thingie.pocket_ref === pocket.value.data._id))

// ===================================================================== Methods
/**
 * @method initUpdate
 * @desc Emits a thinige update to the 'thingies' room using the websocket store socket. If updating the `at` property, the session id is recorded into the update and the thingie is also directly updated in the store rather than waiting for a response over the network.
 */

 const initUpdate = update => {
  if (update.hasOwnProperty('at')) {
    const updateAt = Object.assign({}, update, { omit_session_id: sessionId.value })
    socket.value.emit('update-thingie', updateAt)
    collectorStore.updateThingie(updateAt)
  } else {
    socket.value.emit('update-thingie', update)
  }
}
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
  transform: scale(0.1);
  transform-origin: bottom right;
  transition: transform 300ms ease, opacity 300ms ease-in, visibility 300ms linear, width 400ms ease, height 400ms ease;
  @include modalShadow;
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

.uploader-toggle {
  position: absolute !important;
  left: torem(12);
  bottom: torem(12);
  width: torem(41);
  height: torem(41);
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

.ghost-image {
  position: fixed;
  left: -9999px;
  overflow: hidden;
}
</style>
