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

<script setup>
// ===================================================================== Imports
import ColorThief from '@pioug/colorthief'
import ImageCompression from 'browser-image-compression'

// ======================================================================= Setup
const props = defineProps({
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
})

const emit = defineEmits(['statusChanged', 'fileChanged', 'fileSelected'])

const { $bus } = useNuxtApp()

// ======================================================================== Data
const fileInput = ref(null)
const status = ref('idle') // 'idle', 'initializing', 'uploading', 'upload-complete'
const file = ref(false)
const fileReader = ref(false)
const progress = ref(0)
const place = ref(0)
const goal = ref(0)
const nextChunkPayload = ref(false)
const imageData = ref({})
const pocketStore = usePocketStore()
const { authenticated } = storeToRefs(pocketStore)
const websocketStore = useWebsocketStore()
const { socket } = storeToRefs(websocketStore)

// ==================================================================== Computed
const filename = computed(() => file.value.name)
const filesize = computed(() => file.value.size)
const mimetype = computed(() => file.value.type)

// ==================================================================== Watchers
watch(status, (stat) => { emit('statusChanged', stat) })
watch(file, (val) => { emit('fileChanged', val) })

// ===================================================================== Methods
/**
 * @method computeImageData
 * @desc - Calculates the image aspect ratio and three most prominent colours
 */

const computeImageData = async imgFile => {
  const reader = new FileReader()
  reader.readAsDataURL(imgFile)
  reader.onload = (e) => {
    const image = new Image()
    const colorThief = new ColorThief()
    image.src = e.target.result
    image.onload = async () => {
      const colorPalette = await colorThief.getPalette(image, 3)
      imageData.value = { width: image.width, height: image.height, colorPalette }
    }
  }
}

/**
 * @method compressImage
 * @desc - Returns a compressed version of the image.
 */

const compressImage = async data => {
  ImageCompression.getExifOrientation(data).then((o) => { console.log("ExifOrientation", o) })
  const controller = typeof AbortController !== 'undefined' && new AbortController()
  const options = {
    maxSizeMB: props.maxFileSizeMB,
    maxWidthOrHeight: 3072,
    useWebWorker: true,
    ...(controller && { signal: controller.signal })
  }
  return await ImageCompression(data, options)
    .then((output) => { return output })
    .catch((error) => { console.log(error.message); return false })
}

/**
 * @method handleInputChange
 * @desc - Sets the uploader file to the newly input file. If the file is an image, image data id parsed and the file is compressed.
 */

const handleInputChange = async e => {
  let newFile = e.target.files[0]
  if (newFile) {
    if (['image/jpeg', 'image/png'].includes(newFile.type)) {
      await computeImageData(newFile)
      newFile = await compressImage(newFile, true)
    }
    file.value = newFile
    emit('fileSelected')
    if (!props.promptToUpload) { uploadFile() }
  }
}

/**
 * @method clickFileInput
 */

const clickFileInput = () => {
  if (authenticated.value && fileInput.value) {
    clearFileInput()
    fileInput.value.click()
  }
}

/**
 * @method clearFileInput
 */

const clearFileInput = () => {
  status.value = 'idle'
  file.value = false
  imageData.value = {}
  progress.value = 0
  place.value = 0
  nextChunkPayload.value = false
}

/**
 * @method uploadFile
 */

const uploadFile = () => {
  if (authenticated.value) {
    const formMetadata = {}
    for (const key in file.value) {
      const value = file.value[key]
      typeof value !== 'function' && (formMetadata[key] = value)
    }
    socket.value.emit('module|file-upload-initialize|payload', {
      socket_id: socket.value.id,
      filename: filename.value,
      filesize: filesize.value,
      mimetype: mimetype.value,
      aspect: imageData.value.width / imageData.value.height,
      palette: imageData.value.colorPalette,
      form_metadata: formMetadata
    })
  }
}

/**
 * @method uploadNextChunk
 */

const uploadNextChunk = data => {
  if (!file.value.id) {
    file.value.id = data.file_id
    status.value = 'uploading'
  }
  place.value = data.place
  goal.value = data.goal
  const chunksize = data.chunksize
  const index = place.value * chunksize
  const chunk = file.value.slice(index, index + Math.min(chunksize, (filesize.value - index)), file.value.type)
  progress.value = ((place.value / goal.value) * 100).toFixed(0)
  nextChunkPayload.value = {
    socket_id: socket.value.id,
    file_id: file.value.id,
    file_ext: data.file_ext,
    place: place.value,
    goal: goal.value
  }
  fileReader.value.readAsArrayBuffer(chunk)
}

/**
 * @method fileUploadComplete
 */

const fileUploadComplete = () => {
  status.value = 'upload-complete'
  place.value = 0
  nextChunkPayload.value = false
  if (props.clearFileAfterUpload) { file.value = false }
  if (props.clearProgressAfterUpload) { progress.value = 0 }
}

/**
 * @method handleWebsocketConnected
 */

const handleWebsocketConnected = socket => {
  fileReader.value = new FileReader()
  fileReader.value.onload = (e) => {
    socket.emit('module|file-upload-chunk|payload', Object.assign(nextChunkPayload.value, { chunk: e.target.result }))
  }
  emit('statusChanged', status.value)
  socket.on('module|file-upload-chunk|payload', uploadNextChunk)
  socket.on('module|file-upload-complete|payload', fileUploadComplete)
}

// ======================================================================= Hooks
$bus.$on('socket.io-connected', handleWebsocketConnected)

onBeforeUnmount(() => {
  $bus.$off('socket.io-connected', handleWebsocketConnected)
})
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
