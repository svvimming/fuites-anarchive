<template>
  <UploadInput
    :prompt-to-upload="true"
    accepted-mimetypes="image/jpeg,image/png"
    class="single-file-uploader"
    @statusChanged="statusChanged"
    @fileChanged="fileChanged">

    <template #metadata="{ filename, filesize, mimetype }">
      <div class="metadata">
        <div class="filename">
          {{ filename }}
        </div>
        <div class="row">
          <Tag
            :text="getFilesize(filesize)"
            theme="purple"
            class="filesize" />
          <Tag
            :text="getExtension(mimetype)"
            theme="purple"
            class="mimetype" />
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
          <Spinner v-if="progress >= 100" />
          <span v-else>{{ progress }}%</span>
        </div>
        <IconCheckmark v-else />
      </div>
    </template>

    <template #file-upload-button="{ clickFileInput }">
      <Button
        v-if="!file && status !== 'upload-complete'"
        text="Upload a file"
        class="select-file-button uploader-button"
        type="A"
        @clicked="clickFileInput" />
      <Button
        v-if="status === 'upload-finalized'"
        text="Upload another file"
        class="upload-another-file-button uploader-button"
        type="A"
        @clicked="clickFileInput" />
    </template>

    <template #prompt-to-upload="{ uploadFile, clearFileInput }">

      <div class="upload-prompt">
        Draw a shape to upload selected file
      </div>

      <Bichos @path-complete="(coords) => { initUpload(coords, uploadFile) }" />

      <Button
        text="cancel"
        class="cancel-button uploader-button"
        type="B"
        format="mini"
        @clicked="clearFileInput" />

    </template>

  </UploadInput>
</template>

<script>
// ===================================================================== Imports
import { mapActions } from 'vuex'
import Mime from 'mime'
import Filesize from 'filesize'

import UploadInput from '@/modules/uploader/components/upload-input'
import Button from '@/components/button'
import Tag from '@/components/tag'
import Spinner from '@/components/spinners/material-circle'
import IconCheckmark from '@/components/icons/checkmark'
import Bichos from '@/modules/pocket/components/bichos'

// ====================================================================== Export
export default {
  name: 'SingleFileUploader',

  components: {
    UploadInput,
    Button,
    Tag,
    Spinner,
    IconCheckmark,
    Bichos
  },

  data () {
    return {
      status: false,
      file: false,
      pathData: []
    }
  },

  watch: {
    status (status) {
      if (status === 'uploading') {
        this.removeLoader('upload-file-button')
      }
      if (status === 'upload-complete') {
        this.finalizeUpload()
      }
    }
  },

  methods: {
    ...mapActions({
      removeLoader: 'general/removeLoader',
      postCreateThingie: 'collections/postCreateThingie'
    }),
    getFilesize (filesize) {
      return Filesize(filesize, { standard: 'iec' })
    },
    getExtension (mimetype) {
      return Mime.getExtension(mimetype)
    },
    statusChanged (status) {
      this.status = status
    },
    fileChanged (file) {
      this.file = file
    },
    async finalizeUpload () {
      const complete = await this.postCreateThingie({
        uploadedFileId: this.file.id,
        location: 'pocket',
        type: 'image',
        pathData: this.pathData
      })
      if (complete) {
        this.status = 'upload-finalized'
      }
    },
    initUpload (coords, uploadFile) {
      this.pathData = coords
      uploadFile()
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
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
</style>
