<template>
  <v-group>

    <v-group
      v-if="clipActive"
      ref="clipGroup"
      :config="groupConfig">
      <v-image :config="clipConfig" />
    </v-group>
    
    <v-image :config="imageConfig" :key="key" />

  </v-group>
</template>

<script setup>
// ======================================================================= Props
const props = defineProps({
  fileRef: {
    type: Object,
    required: true
  },
  parentConfig: {
    type: Object,
    required: true
  },
  options: {
    type: Object,
    required: false,
    default: () => ({})
  },
  clipActive: {
    type: Boolean,
    required: false,
    default: false
  },
  path: {
    type: String,
    required: false,
    default: ''
  }
})

// ======================================================================== Data
const imageLoadError = ref(false)
const imageLoading = ref(false)
const image = ref(false)
const canvas = ref(false)
const clipPath = ref(false)
const clipGroup = ref(null)
const clipGroupVisible = ref(false)
const generalStore = useGeneralStore()
const { baseUrl } = storeToRefs(generalStore)
const key = ref(0)

// ==================================================================== Computed
const imageConfig = computed(() => ({
  thingie_id: props.parentConfig.thingie_id,
  width: props.parentConfig.width,
  height: props.parentConfig.height,
  image: props.clipActive && canvas.value ? canvas.value : image.value,
  ...props.options
}))

const clipConfig = computed(() => ({
  width: 200,
  height: 200,
  image: image.value
}))

const groupConfig = computed(() => ({
  ...(clipPath.value && { clipFunc: () => [new Path2D(clipPath.value), 'evenodd'] }),
  visible: clipGroupVisible.value
}))

// ==================================================================== Watchers
watch(() => props.options, () => { key.value++ }, { deep: true })

watch(() => props.clipActive, (val) => {
  if (val && !canvas.value) {
    nextTick(() => { applyClipPath() })
  }
})

// ===================================================================== Methods
/**
 * @method applyClipPath
 */

const applyClipPath = () => {
  clipPath.value = useGetSvgPath(props.path, clipConfig.value.width, clipConfig.value.height, { closed: true })
  if (clipPath.value && clipGroup.value) {
    clipGroupVisible.value = true
    nextTick(() => {
      const group = clipGroup.value.getNode()
      canvas.value = group.toCanvas({ pixelRatio: 2 })
      clipGroupVisible.value = false
    })
  }
}

/**
 * @method loadImage
 */

const loadImage = () => {
  imageLoading.value = true
  const img = document.createElement('img')
  img.onload = function () {
    imageLoadError.value = false
    imageLoading.value = false
    image.value = img
    if (props.clipActive) {
      nextTick(() => { applyClipPath() })
    }
  }
  img.onerror = function () {
    imageLoadError.value = true
    imageLoading.value = false
  }
  img.src = `${baseUrl.value}/uploads/${props.fileRef._id}.${props.fileRef.file_ext}`
}

// ======================================================================= Hooks
onMounted(() => { loadImage() })

</script>
