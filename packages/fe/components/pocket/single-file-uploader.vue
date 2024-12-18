<template>
  <PocketUploadInput
    accepted-mimetypes="image/jpeg,image/png,audio/mpeg,audio/x-m4a"
    :max-file-size-mb="maxFileSizeMB"
    :class="[
      'single-file-uploader',
      { 'active': status !== 'idle' },
      { 'upload-input': (status === 'ready' || status === 'uploading') && uploaderOpen }
    ]">

    <template #metadata="{ filename, filesize, mimetype }">
      <div class="metadata">
        <div class="filename">
          {{ filename }}
        </div>
        <div class="row">
          <div class="tag filesize">
            {{ getFilesize(filesize) }}
          </div>
          <div class="tag mimetype">
            {{ getExtension(mimetype) }}
          </div>
        </div>
      </div>
    </template>

    <template #progress="{ progress }">
      <div class="progress">
        <div
          v-if="progress >= 100"
          class="finalizing-container">
          <span>upload complete</span>
        </div>
        <div class="progress-bar-container">
          <div :style="{ width: `${progress}%` }" class="progress-bar" />
        </div>
        <div v-if="status !== 'upload-complete'" class="percentage">
          <SpinnerMaterialCircle v-if="progress >= 100" />
          <span v-else>{{ progress }}%</span>
        </div>
        <span v-else>✅</span>
      </div>
    </template>

    <template #prompt-to-upload="{ uploadFile }">
      <div :class="['upload-prompt', { 'margin-large': fullscreen }]" v-html="finalizeUploadPrompt"></div>
      <PocketBichos @path-completed="(path) => { bicho = path; uploadFile() }" />
    </template>

  </PocketUploadInput>
</template>

<script setup>
// ===================================================================== Imports
import Mime from 'mime'
import { filesize } from 'filesize'

// ======================================================================= Setup
const props = defineProps({
  finalPrompt: {
    type: String,
    required: false,
    default: ''
  },
  uploadToPage: {
    type: String,
    required: false,
    default: ''
  },
  maxFileSizeMB: {
    type: Number,
    required: false,
    default: 8
  }
})

// ======================================================================== Data
const bicho = ref([])
const collectorStore = useCollectorStore()
const pocketStore = usePocketStore()
const { uploaderOpen, uploader, fullscreen } = storeToRefs(pocketStore)

// ==================================================================== Computed
const file = computed(() => uploader.value.file)
const status = computed(() => uploader.value.status)
const finalizeUploadPrompt = computed(() => {
  return file.value.size > (props.maxFileSizeMB * 1000000) ?
    `compressed file size is too big! :-O<br>max is ${props.maxFileSizeMB}mb` : props.finalPrompt || 'Draw a shape to upload selected file:'
})

// ==================================================================== Watchers
watch(status, (stat) => {
  if (stat === 'upload-complete') {
    pocketStore.setUploaderOpen(false)
    finalizeUpload()
  }
})

// ===================================================================== Methods
const getFilesize = size => { return filesize(size, { standard: 'iec' }) }
const getExtension = data => { return Mime.getExtension(data) }

/**
 * @method finalizeUpload
 * @desc Calls the pockets [postCreateThingie()] method passing the 'bicho' path data to the new thingie.
 */

const finalizeUpload = async () => {
  await collectorStore.postCreateThingie({
    file_id: file.value.id,
    ...(!!props.uploadToPage && { location: props.uploadToPage }),
    thingie_type: ['audio/mpeg', 'audio/x-m4a'].includes(file.value.type) ? 'sound' : 'image',
    path_data: bicho.value,
    location: 'pocket',
    at: {
      x: Math.random() * 650,
      y: Math.random() * 400,
      width: 80,
      height: 80,
      rotation: 0
    }
  })
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.single-file-uploader {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  border-radius: torem(25);
  overflow: hidden;
  &.active {
    z-index: 100;
    :deep(.upload-input-container) {
      visibility: visible;
      opacity: 0;
      transform: scale(0.9);
    }
  }
  &.upload-input {
    :deep(.upload-input-container) {
      transform: scale(1);
      opacity: 1;
    }
  }
}

:deep(.upload-input-container) {
  position: absolute;
  padding: 0.75rem;
  left: torem(3);
  top: torem(3);
  width: calc(100% - torem(6));
  height: calc(100% - torem(6));
  background-color: rgba(255, 255, 255, 0.75);
  border-radius: torem(25);
  visibility: hidden;
  opacity: 0;
  transform: scale(0.9);
  transition: 200ms ease;
}

.upload-prompt {
  margin-bottom: 0.75rem;
  &.margin-large {
    margin-top: 0.5rem;
    margin-bottom: 1rem;
  }
}

// //////////////////////////////////////////////////////////////////// Metadata
:deep(.metadata) {
  position: absolute;
  padding: 0.125rem 0.25rem;
  top: 50%;
  left: torem(24);
  max-width: torem(140);
  transform: translate(0, -50%);
}

:deep(.filename) {
  padding: 0 0.5rem;
  padding-left: 0;
  margin: 0.25rem 0;
  margin-right: 0.5rem;
  width: 100%;
  line-height: 1.2;
  font-family: 'Source Code Pro', monospace;
  font-size: 0.6875rem;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
}

:deep(.filesize),
:deep(.mimetype) {
  font-family: 'Source Code Pro', monospace;
  font-size: 0.6875rem;
  line-height: 1.2;
  overflow-wrap: break-word;
  .text {
    line-height: 1;
  }
}

.row {
  display: flex;
  flex-direction: row;
  align-items: center;
  .tag {
    &:not(:last-child) {
      margin-right: 0.375rem;
    }
  }
}

// //////////////////////////////////////////////////////////////// Progress bar
:deep(.progress) {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  margin-top: 0.75rem;
}

.finalizing-container,
.finzlized-container {
  font-size: 0.75rem;
  white-space: nowrap;
}

:deep(.progress-bar-container) {
  position: relative;
  width: 100%;
  height: 0.3125rem;
  margin: 0 0.5rem;
  border-radius: 0.125rem;
  overflow: hidden;
  background-color: #5F5F5F;
}

:deep(.progress-bar) {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: $woodsmoke;
}

:deep(.percentage) {
  font-family: monospace;
  font-size: 0.75rem;
  line-height: 1;
  margin-bottom: 2px;
}

:deep(.icon-checkmark) {
  width: 1.75rem;
  path {
    stroke: $lavender;
  }
}

</style>
