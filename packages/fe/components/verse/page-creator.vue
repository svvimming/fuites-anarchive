<template>
  <ZeroAlert
    mode="modal"
    alert-id="page-creator-alert"
    :class="['page-creator-alert']">
    <!-- ================================================== Mode: [New Page] -->
    <div class="message new-page-modal">
      <!-- ------------------------------------------------------------ text -->
      <span class="title text">{{ newPageTitle }}</span>
      <span class="prompt text">{{ newPageMessage }}</span>
      <!-- -------------------------------------------------------- uploader -->
      <PocketSingleFileUploader
        :uploader-id="modalUploaderId"
        :class="{ shrink: uploader?.status === 'idle' || uploader?.status === 'initializing' }" />
      <!-- -------------------------------------------- open uploader button -->
      <div v-if="authenticated" class="button-row">
        <ButtonBasic
          :class="['uploader-button', { 'upload-ready': uploader?.status === 'ready' }]"
          :force-loading="uploader?.status === 'initializing'"
          :force-disabled="uploader?.status === 'uploading'"
          @clicked="pocketStore.toggleUploaderOpen({ id: modalUploaderId })">
          {{ uploader?.status === 'ready' ? 'Cancel' : 'Upload file' }}
        </ButtonBasic>
      </div>

    </div>

  </ZeroAlert>
</template>

<script setup>
// ======================================================================== Data
const route = useRoute()
const pocketStore = usePocketStore()
const { uploaders, authenticated } = storeToRefs(pocketStore)
const modalUploaderId = 'new-page-modal-uploader'

// ==================================================================== Computed
const uploader = computed(() => uploaders.value[modalUploaderId])
const newPageTitle = computed(() => `'${route.params.page}' doesn't seem to exist yet!`)
const newPageMessage = computed(() => authenticated.value ? `You can create a new page called ${route.params.page} by uploading a thingie below:` : `You can create a new page called '${route.params.page}' but first, you'll need to enter a token using the pocket.`)

// ======================================================================= Hooks
onMounted(() => {
  pocketStore.registerUploader(modalUploaderId)
})
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.message {
  position: absolute;
  left: 50%;
  top: 50%;
  padding: torem(16);
  border-radius: torem(20);
  transform: translate(-50%, -50%) scale(0.8);
  transition: 300ms ease;
  background-color: $athensGray;
  // box-shadow: 0 torem(6) torem(10) rgba(0, 0, 0, 0.25);
  @include modalShadow;
  .title {
    font-weight: 600;
  }
  .title,
  .prompt {
    margin-bottom: torem(10);
  }
  .text {
    display: block;
    font-size: torem(12);
    line-height: 1.5;
  }
}

.new-page-modal {
  width: torem(382);
}

.button-row {
  display: flex;
  justify-content: center;
  width: 100%;
  // margin-top: torem(10);
}

// //////////////////////////////////////////////////////////////////// Uploader
:deep(.single-file-uploader) {
  position: relative;
  left: unset;
  bottom: unset;
  border-radius: torem(9);
  margin: torem(10) 0;
  &.shrink {
    margin: 0;
    height: 0;
  }
}

:deep(.upload-input-container) {
  position: relative;
  left: unset;
  top: unset;
  width: unset;
  height: unset;
  .upload-prompt {
    font-size: torem(12);
    padding-bottom: torem(42);
  }
  .metadata {
    left: 50%;
    top: torem(40);
    height: torem(32);
    transform: translate(-50%, 0);
    max-width: torem(112);
    .filename,
    .tag {
      font-size: torem(8);
    }
  }
}

:deep(.bicho-canvas-wrapper) {
  width: torem(296);
  height: torem(296);
}

:deep(.bicho-canvas) {
  width: torem(296);
  height: torem(296);
}
</style>
