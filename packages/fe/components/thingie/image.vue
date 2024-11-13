<template>
  <v-image :config="config" :key="key"></v-image>
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
const generalStore = useGeneralStore()
const { baseUrl } = storeToRefs(generalStore)
const { $simplifySvgPath } = useNuxtApp()
const key = ref(0)

// ==================================================================== Computed
const config = computed(() => ({
  thingie_id: props.parentConfig.thingie_id,
  width: props.parentConfig.width,
  height: props.parentConfig.height,
  image: image.value,
  ...props.options
}))

const clipPath = computed(() => {
  const data = []
  const coords = props.path.split(' ').map(num => parseInt(num) / 200)
  const w = config.value.width
  const h = config.value.height
  const len = coords.length
  for (let i = 0; i < len - 1; i += 2) {
    data.push([coords[i] * w, coords[i + 1] * h])
  }
  if (data.length) {
    return $simplifySvgPath(data, { tolerance: 0.001 }) + ' Z'
  }
  return false
})

const container = computed(() => Object.assign({}, {
  ...(clipPath.value && { clipFunc: () => [new Path2D(clipPath.value), 'evenodd'] })
}))

// ==================================================================== Watchers
watch(() => props.options, () => { key.value++ }, { deep: true })

// ===================================================================== Methods
/**
 * @method  
 */

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
  }
  img.onerror = function () {
    imageLoadError.value = true
    imageLoading.value = false
  }
  img.src = `${baseUrl.value}/${props.fileRef._id}.${props.fileRef.file_ext}`
}

// ======================================================================= Hooks
onMounted(() => { loadImage() })

</script>
