<template>
  <v-image
    v-if="raster"
    ref="imgNode"
    :config="textConfig"
    :key="key" />
</template>

<script setup>
// ======================================================================= Setup
const props = defineProps({
  parentConfig: {
    type: Object,
    required: true
  },
  options: {
    type: Object,
    required: false,
    default: () => ({})
  },
  text: {
    type: String,
    required: true
  },
  hidden: {
    type: Boolean,
    required: false,
    default: false
  }
})

const emit = defineEmits(['loaded'])

// ======================================================================== Data
const key = ref(0)
const raster = ref(false)
const imgNode = ref(null)
const generalStore = useGeneralStore()
const { baseUrl } = storeToRefs(generalStore)

// ==================================================================== Computed
const textConfig = computed(() => ({
  thingie_id: props.parentConfig.thingie_id,
  width: props.parentConfig.width,
  height: props.parentConfig.height,
  image: raster.value,
  visible: !props.hidden,
  ...props.options
}))

// ==================================================================== Watchers
watch(() => props.options, () => { key.value++ }, { deep: true })
watch([
  () => props.text,
  () => props.parentConfig.width,
  () => props.parentConfig.height
], () => { rasterizeText() })

// ======================================================================= Hooks
onMounted(() => { rasterizeText() })

// ===================================================================== Methods
const rasterizeText = () => {
  if (process.client) {    
    const dimensions = { width: textConfig.value.width, height: textConfig.value.height }
    const canvas = useGetHiPPICanvas(dimensions)
    const foreignObjectSvg = useGetForeignObject(props.text, dimensions)
    const svgBlob = new Blob([foreignObjectSvg], { type: 'image/svg+xml;charset=utf-8' })
    const svgObjectUrl = URL.createObjectURL(svgBlob)

    const svg = new Image()
    svg.addEventListener('load', function() {
      const ctx = canvas.getContext('2d')
      ctx.drawImage(svg, 0, 0)
      URL.revokeObjectURL(svgObjectUrl)
      raster.value = canvas
      key.value++
      emit('loaded', true)
      // draw hit area for raster
      nextTick(() => {
        if (imgNode.value && !baseUrl.value.startsWith('https://localhost')) {
          imgNode.value.getNode().cache()
          imgNode.value.getNode().drawHitFromCache()
        }
      })
    })
    svg.src = svgObjectUrl
  }
}
</script>
