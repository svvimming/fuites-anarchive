<template>
  <div class="uploader">
    <div class="upload-input-container">
      <!-- ======================================================== metadata -->
      <slot
        v-if="file"
        :filename="filename"
        :filesize="filesize"
        :mimetype="mimetype"
        name="metadata" />

      <div class="input-wrapper">
        <!-- ======================================================== loader -->
        <slot
          v-if="status === 'uploading' || status === 'upload-complete'"
          :progress="progress" name="progress" />
        <!-- ========================================== [button] upload file -->
        <div class="file-upload-container">
          <input
            ref="fileInput"
            type="file"
            class="input"
            :accept="acceptedMimetypes"
            @change="handleInputChange"
            @cancel="pocketStore.toggleUploaderOpen({ id: uploaderId, newValue: false })" />
        </div>
        <!-- ===================================== [button] prompt to upload -->
        <slot
          v-if="status === 'ready'"
          :upload-file="uploadFile"
          name="prompt-to-upload" />
      </div>

    </div>
  </div>
</template>

<script setup>
// ===================================================================== Imports
import ColorThief from '@pioug/colorthief'
import ImageCompression from 'browser-image-compression'

// ======================================================================= Setup
const props = defineProps({
  uploaderId: {
    type: String,
    required: true
  },
  acceptedMimetypes: {
    type: String,
    required: true
  },
  maxFileSizeMB: {
    type: Number,
    required: false,
    default: 8
  }
})

const { $bus } = useNuxtApp()

// ======================================================================== Data
const fileInput = ref(null)
const fileReader = ref(false)
const progress = ref(0)
const place = ref(0)
const goal = ref(0)
const nextChunkPayload = ref(false)
const imageData = ref({})
const websocketStore = useWebsocketStore()
const { socket } = storeToRefs(websocketStore)
const pocketStore = usePocketStore()
const { authenticated, uploaders } = storeToRefs(pocketStore)

// ==================================================================== Computed
const uploader = computed(() => uploaders.value[props.uploaderId])
const uploaderOpen = computed(() => uploader.value?.open)
const file = computed(() => uploader.value?.file)
const status = computed(() => uploader.value?.status)
const filename = computed(() => file.value?.name)
const filesize = computed(() => file.value?.size)
const mimetype = computed(() => file.value?.type)

// ==================================================================== Watchers
watch(uploaderOpen, (val) => {
  if (val) {
    clickFileInput()
  } else {
    console.log('hit uploaderOpen watcher')
    clearFileInput({ file: false, file_id: false })
    setTimeout(() => {
      pocketStore.setUploader({ id: props.uploaderId, status: 'idle' })
    }, 200)
  }
})
// ===================================================================== Methods
/**
 * @method computeImageData
 * @desc - Calculates the three most prominent colours.
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
      imageData.value = { colorPalette }
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
 * @desc Sets the uploader file to the newly input file. If the file is an image, image data id parsed and the file is compressed. The uploader status is set to `initializing` while the file is being processed, then set to `ready` when it is ready to be uploaded.
 */

const handleInputChange = async e => {
  let newFile = e.target.files[0]
  if (newFile) {
    pocketStore.setUploader({ id: props.uploaderId, status: 'initializing' })
    if (['image/jpeg', 'image/png'].includes(newFile.type)) {
      await computeImageData(newFile)
      newFile = await compressImage(newFile, true)
    }
    pocketStore.setUploader({ id: props.uploaderId, status: 'ready', file: newFile, file_id: false })
  }
}

/**
 * @method clickFileInput
 */

const clickFileInput = () => {
  console.log(props.uploaderId, authenticated.value, fileInput.value)
  if (authenticated.value && fileInput.value) {
    console.log('hit click file input')
    clearFileInput({ id: props.uploaderId, status: 'idle', file: false, file_id: false })
    fileInput.value.click()
  }
}

/**
 * @method clearFileInput
 */

const clearFileInput = reset => {
  imageData.value = {}
  progress.value = 0
  place.value = 0
  nextChunkPayload.value = false
  pocketStore.setUploader(reset)
}

/**
 * @method uploadFile
 */

const uploadFile = () => {
  if (authenticated.value && file.value && uploaderOpen.value) {
    pocketStore.setUploader({ id: props.uploaderId, status: 'uploading' })
    socket.value.emit('module|file-upload-initialize|payload', {
      socket_id: socket.value.id,
      filename: filename.value,
      filesize: filesize.value,
      mimetype: mimetype.value,
      palette: imageData.value.colorPalette
    })
  }
}

/**
 * @method uploadNextChunk
 */

const uploadNextChunk = data => {
  if (!uploader.value.file_id) {
    pocketStore.setUploader({ id: props.uploaderId, file_id: data.file_id })
  }
  place.value = data.place
  goal.value = data.goal
  const chunksize = data.chunksize
  const index = place.value * chunksize
  console.log('upload next chunk', uploader.value)
  console.log(file.value)
  const chunk = file.value.slice(index, index + Math.min(chunksize, (filesize.value - index)), file.value.type)
  progress.value = ((place.value / goal.value) * 100).toFixed(0)
  nextChunkPayload.value = {
    socket_id: socket.value.id,
    file_id: uploader.value.file_id,
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
  pocketStore.setUploader({ id: props.uploaderId, status: 'upload-complete' })
  place.value = 0
  nextChunkPayload.value = false
}

/**
 * @method handleWebsocketConnected
 */

const handleWebsocketConnected = websocket => {
  console.log('handle websocket connected')
  fileReader.value = new FileReader()
  fileReader.value.onload = (e) => {
    console.log(props.uploaderId, e)
    websocket.emit('module|file-upload-chunk|payload', Object.assign(nextChunkPayload.value, { chunk: e.target.result }))
  }
  websocket.on('module|file-upload-chunk|payload', uploadNextChunk)
  websocket.on('module|file-upload-complete|payload', fileUploadComplete)
}

// ======================================================================= Hooks
$bus.$on('socket.io-connected', handleWebsocketConnected)

onBeforeUnmount(() => {
  $bus.$off('socket.io-connected', handleWebsocketConnected)
})
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.input-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
}

// //////////////////////////////////////////////////////// [button] file upload
.file-upload-container {
  position: relative;
}

.file-upload-button-wrapper {
  position: absolute;
  left: torem(12);
  bottom: torem(12);
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
