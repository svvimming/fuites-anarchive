<template>
  <div :class="['uploader-modal', { active }]">

    <PocketUploadInput
      :prompt-to-upload="true"
      accepted-mimetypes="image/jpeg,image/png,audio/mpeg,audio/x-m4a"
      :max-file-size-mb="maxFileSizeMB"
      class="single-file-uploader"
      @statusChanged="statusChanged"
      @fileSelected="fileSelected"
      @fileChanged="fileChanged">

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
        <div v-if="status === 'uploading' || status === 'upload-complete' || status === 'upload-finalized'" class="progress">
          <div
            v-if="progress >= 100"
            class="finalizing-container">
            <span v-if="status === 'upload-finalized'">upload complete</span>
            <span v-else>finalizing</span>
          </div>
          <div class="progress-bar-container">
            <div :style="{ width: `${progress}%` }" class="progress-bar" />
          </div>
          <div v-if="status !== 'upload-finalized'" class="percentage">
            <SpinnerMaterialCircle v-if="progress >= 100" />
            <span v-else>{{ progress }}%</span>
          </div>
          <span v-else>✅</span>
        </div>
      </template>

      <template #file-upload-button="{ clickFileInput }">
        <button
          v-if="!file && status !== 'upload-complete' && !processingFile"
          class="select-file-button uploader-button"
          @click="clickFileInput">
          {{ initializeUploadPrompt }}
        </button>
        <button
          v-if="status === 'upload-finalized' && !processingFile"
          class="upload-another-file-button uploader-button"
          @click="clickFileInput">
          Upload another file
        </button>
        <SpinnerTripleDot
          v-if="processingFile"
          class="file-processing-loader theme-dark" />
      </template>

      <template #prompt-to-upload="{ uploadFile, clearFileInput }">
        <div
          class="upload-prompt"
          v-html="finalizeUploadPrompt">
        </div>
        <button
          class="upload-button"
          @click="initUpload([], uploadFile)">
          Upload
        </button>
        <!-- <Bichos @path-complete="(coords) => { initUpload(coords, uploadFile) }" /> -->
        <button
          class="cancel-button uploader-button"
          @click="clearFileInput">
          Cancel
        </button>
      </template>

    </PocketUploadInput>

  </div>
</template>

<script setup>
// ===================================================================== Imports
import Mime from 'mime'
import { filesize } from 'filesize'

// ======================================================================= Setup
const props = defineProps({
  active: {
    type: Boolean,
    required: false,
    default: false
  },
  uploadOnDrawBicho: {
    type: Boolean,
    required: false,
    default: true
  },
  initPrompt: {
    type: String,
    required: false,
    default: ''
  },
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

const emit = defineEmits(['upload-finalized', 'draw-bicho-complete'])

// ======================================================================== Data
const status = ref(false)
const file = ref(false)
const pathData = ref([])
const processingFile = ref(false)
const pocketStore = usePocketStore()

// ==================================================================== Computed
const initializeUploadPrompt = computed(() => props.initPrompt || 'Upload a file')
const destination = computed(() => props.uploadToPage || 'pocket')
const finalizeUploadPrompt = computed(() => {
  if (file.value) {
    return file.value.size > (props.maxFileSizeMB * 1000000) ?
      `compressed file size is too big! :-O<br>max is ${props.maxFileSizeMB}mb` : props.finalPrompt || 'Draw a shape to upload selected file'
  }
  return ''
})

// ==================================================================== Watchers
watch(status, (stat) => {
  if (stat === 'uploading') {
    // remove file upload button loader here
    // this.removeLoader('upload-file-button')
  }
  if (stat === 'upload-complete') {
    finalizeUpload()
  }
})

// ===================================================================== Methods
const getFilesize = size => { return filesize(size, { standard: 'iec' }) }
const getExtension = data => { return Mime.getExtension(data) }
const statusChanged = stat => { status.value = stat }
const fileSelected = () => { processingFile.value = true }
const fileChanged = data => {
  processingFile.value = false
  file.value = data
}

const finalizeUpload = async () => {
  const complete = await pocketStore.postCreateThingie({
    file_id: file.value.id,
    location: destination.value,
    thingie_type: ['audio/mpeg', 'audio/x-m4a'].includes(file.value.type) ? 'sound' : 'image',
    pathData: pathData.value,
    at: {
      x: Math.random() * 650,
      y: Math.random() * 400,
      width: 80,
      height: 80,
      rotation: 0
    }
  })
  if (complete) {
    status.value = 'upload-finalized'
    emit('upload-finalized')
  }
}

const initUpload = (coords, uploadFile) => {
  pathData.value = coords
  if (props.uploadOnDrawBicho) {
    uploadFile()
  } else {
    emit('draw-bicho-complete')
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.uploader-modal {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}

.single-file-uploader {
  position: relative;
  // padding: 1rem;
  z-index: 10;
}

.row {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}

// //////////////////////////////////////////////////////////////////// Metadata
:deep(.metadata) {
  border: 1px solid rgba(black, 0.5);
  border-radius: 0.25rem;
  padding: 0.125rem 0.25rem;
  max-width: toRem(220);
}

:deep(.filename) {
  padding: 0 0.5rem;
  margin: 0.25rem 0;
  line-height: 1.2;
  @include fontFamily_Cousine;
  @include fontSize_teeny;
  text-align: center;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.filesize),
:deep(.mimetype) {
  @include fontFamily_Cousine;
  @include fontSize_teeny;
  text-align: center;
  line-height: 1.2;
  .text {
    line-height: 1;
  }
}

:deep(.filesize) {
  margin-right: 0.5rem;
}

:deep(.mimetype) {
  text-transform: uppercase;
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
  background-color: black;
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

// ///////////////////////////////////////////////////////////////////// Buttons
.uploader-button {
  @include linkHover(#000000);
  padding: 0.5rem 1rem;
  text-align: center;
}
.upload-file-button,
.upload-another-file-button {
  margin: 0.375rem 0;
}

.cancel-button {
  margin-top: 0.5rem;
}

:deep(.button) {
  @include link;
}

.upload-prompt {
  padding: 0.5rem 1rem;
  text-align: center;
  margin: 0.375rem 0;
  white-space: nowrap;
}

.file-processing-loader {
  position: relative;
  padding: 0.875rem 1rem;
  // width: 100%;
  // height: 100%;
  opacity: 1;
}
</style>
