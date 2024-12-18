<template>
  <div id="modal" :class="[{ open: modal.active }]">
    
    <!-- <VerseAuth
      v-if="modal.action === 'auth'"
      @close-modal="generalStore.closeModal()" /> -->

    <div
      v-if="modal.action === 'new-page'"
      class="message">

      <span class="title text">New page</span>

      <span class="text">{{ newPageMessage }}</span>

      <!-- <PocketSingleFileUploader /> -->

      <!-- <ButtonIcon
        :class="['uploader-toggle', { 'upload-ready': uploader.status === 'ready' }]"
        :force-loading="uploader.status === 'initializing'"
        :force-disabled="uploader.status === 'uploading'"
        @clicked="pocketStore.setUploaderOpen(!uploaderOpen)">
        <IconPlus class="icon" />
      </ButtonIcon> -->

    </div>

  </div>
</template>

<script setup>
// ======================================================================== Data
const route = useRoute()
const generalStore = useGeneralStore()
const { modal } = storeToRefs(generalStore)
const pocketStore = usePocketStore()
const {
  uploader,
  uploaderOpen,
} = storeToRefs(pocketStore)

const newPageMessage = computed(() => `'${route.params.page}' doesn't seem to exist yet! But you can create it by uploading a thingie below:`)
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
#modal {
  position: absolute;
  visibility: hidden;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: 300ms ease;
  z-index: 2;
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba($woodsmoke, 0.8);
  }
  &.open {
    visibility: visible;
    opacity: 1;
    .message {
      transform: translate(-50%, -50%) scale(1);
    }
  }
}

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
    margin-bottom: torem(10);
  }
  .text {
    display: block;
    font-size: torem(12);
  }
}
</style>
