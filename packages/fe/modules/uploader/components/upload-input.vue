<template>
  <div class="upload-input-container">

    <!-- ========================================================== metadata -->
    <slot
      v-if="file"
      :filename="filename"
      :filesize="filesize"
      :mimetype="mimetype"
      name="metadata" />

    <!-- ============================================================ loader -->
    <slot
      :progress="progress"
      name="progress" />

    <!-- ============================================== [button] upload file -->
    <div class="file-upload-container">

      <div class="file-upload-button-wrapper">
        <slot
          :click-file-input="clickFileInput"
          name="file-upload-button" />
      </div>

      <input
        ref="fileInput"
        type="file"
        class="input"
        :accept="acceptedMimetypes"
        @change="handleInputChange" />

    </div>

    <!-- ========================================= [button] prompt to upload -->
    <slot
      v-if="file && promptToUpload && status === 'idle'"
      :upload-file="uploadFile"
      :clear-file-input="clearFileInput"
      name="prompt-to-upload" />

    <!-- ===================================== [general content area] bottom -->
    <slot name="bottom" />

  </div>
</template>

<script>
// ===================================================================== Imports
import { mapGetters } from 'vuex'

import ColorThief from 'colorthief'
import ImageCompression from 'browser-image-compression'

// =================================================================== Functions
const getImageData = async (instance, file) => {
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = (e) => {
    const image = new Image()
    const colorThief = new ColorThief()
    image.src = e.target.result
    image.onload = async () => {
      instance.imageAspectRatio = image.width / image.height
      const palette = await colorThief.getPalette(image, 3)
      instance.imageColorPalette = palette
    }
  }
}

const compressImage = async (file, useWebWorker, maxSizeMB) => {
  ImageCompression.getExifOrientation(file).then((o) => {
    console.log("ExifOrientation", o)
  })
  const controller = typeof AbortController !== 'undefined' && new AbortController()
  const maxWidthOrHeight = 3072
  const onProgress = (p) => {
    console.log("onProgress", p)
  }
  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker,
    onProgress
  }
  console.log(controller)
  if (controller) {
    options.signal = controller.signal
  }
  const compressedFile = await ImageCompression (file, options)
    .then((output) => {
      console.log("original", file)
      console.log("output", output)
      return output
    })
    .catch((error) => {
      console.log(error.message)
    })

  return compressedFile
}

// ====================================================================== Export
export default {
  name: 'UploadInput',

  props: {
    acceptedMimetypes: {
      type: String,
      required: true
    },
    promptToUpload: {
      type: Boolean,
      required: false,
      default: true
    },
    clearFileAfterUpload: {
      type: Boolean,
      required: false,
      default: false
    },
    clearProgressAfterUpload: {
      type: Boolean,
      required: false,
      default: false
    },
    maxFileSizeMB: {
      type: Number,
      required: false,
      default: 8
    }
  },

  data () {
    return {
      status: 'idle', // 'idle', 'initializing', 'uploading', 'upload-complete'
      file: false,
      fileReader: false,
      socket: false,
      progress: 0,
      place: 0,
      nextChunkPayload: false,
      imageAspectRatio: 1,
      imageColorPalette: []
    }
  },

  computed: {
    ...mapGetters({
      authenticated: 'general/authenticated'
    }),
    filename () {
      return this.file.name
    },
    filesize () {
      return this.file.size
    },
    mimetype () {
      return this.file.type
    }
  },

  watch: {
    status (status) {
      this.$emit('statusChanged', status)
    },
    file (file) {
      this.$emit('fileChanged', file)
    }
  },

  async mounted () {
    this.fileReader = new FileReader()
    this.fileReader.onload = (e) => {
      this.socket.emit('module|file-upload-chunk|payload', Object.assign(this.nextChunkPayload, {
        chunk: e.target.result
      }))
    }
    this.$emit('statusChanged', status)
    await this.$connectWebsocket(this, () => {
      this.socket.on('module|file-upload-chunk|payload', this.uploadNextChunk)
      this.socket.on('module|file-upload-complete|payload', this.fileUploadComplete)
    })
  },

  methods: {
    async handleInputChange (e) {
      const file = e.target.files[0]
      if (file) {
        this.$emit('fileSelected')
        if (['image/jpeg', 'image/png'].includes(file.type)) {
          await getImageData(this, file)
          const compressedImageFile = await compressImage(file, true, this.maxFileSizeMB)
          this.file = compressedImageFile
        } else {
          this.file = file
        }
        if (!this.promptToUpload) {
          this.uploadFile()
        }
      }
    },
    clickFileInput () {
      if (this.authenticated) {
        this.clearFileInput()
        this.$refs.fileInput.click()
      }
    },
    clearFileInput () {
      if (this.authenticated) {
        this.status = 'idle'
        this.file = false
        this.imageAspectRatio = 1
        this.imageColorPalette = []
        this.progress = 0
        this.place = 0
        this.nextChunkPayload = false
        this.$refs.fileInput.value = null
      }
    },
    uploadFile () {
      if (this.authenticated) {
        const file = this.file
        const formMetadata = {}
        for (const key in file) {
          const value = file[key]
          typeof value !== 'function' && (formMetadata[key] = value)
        }
        this.socket.emit('module|file-upload-initialize|payload', {
          socket_id: this.socket.id,
          filename: this.filename,
          filesize: this.filesize,
          mimetype: this.mimetype,
          aspect: this.imageAspectRatio,
          palette: this.imageColorPalette,
          form_metadata: formMetadata
        })
      }
    },
    uploadNextChunk (data) {
      const file = this.file
      if (!file.id) {
        this.file.id = data.file_id
        this.status = 'uploading'
      }
      const chunksize = data.chunksize
      const filesize = this.filesize
      const place = data.place * chunksize
      const chunk = file.slice(place, place + Math.min(chunksize, (filesize - place)), file.type)
      this.place = data.place
      this.goal = data.goal
      this.progress = ((this.place / this.goal) * 100).toFixed(0)
      this.nextChunkPayload = {
        socket_id: this.socket.id,
        file_id: file.id,
        file_ext: data.file_ext,
        place: this.place,
        goal: this.goal
      }
      this.fileReader.readAsArrayBuffer(chunk)
    },
    fileUploadComplete () {
      this.status = 'upload-complete'
      this.place = 0
      this.nextChunkPayload = false
      if (this.clearFileAfterUpload) {
        this.file = false
      }
      if (this.clearProgressAfterUpload) {
        this.progress = 0
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.upload-input-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

// //////////////////////////////////////////////////////// [button] file upload
.file-upload-container {
  position: relative;
}

.file-upload-button-wrapper {
  position: relative;
  z-index: 10;
}

.input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  z-index: 5;
}
</style>
