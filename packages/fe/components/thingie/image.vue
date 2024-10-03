<template>
  <v-image :config="config"></v-image>
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
  }
})

// ======================================================================== Data
const imageLoadError = ref(false)
const imageLoading = ref(false)
const image = ref(false)
const generalStore = useGeneralStore()
const { baseUrl } = storeToRefs(generalStore)

// ==================================================================== Computed
const config = computed(() => ({
  thingie_id: props.parentConfig.thingie_id,
  width: props.parentConfig.width,
  height: props.parentConfig.height,
  image: image.value,
}))

// ===================================================================== Methods
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
onMounted(() => {
  loadImage()
})
</script>
