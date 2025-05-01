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
    const div = document.createElement('div')
    div.innerHTML = props.text
    const canvas = useGetHiPPICanvas({ width: textConfig.value.width, height: textConfig.value.height })
    const render = useRenderTextElementToCanvas(canvas, div, textConfig.value)
    console.log(render)
    raster.value = render.canvas
    key.value++
    div.remove()
    emit('loaded', true)
    // draw hit area for raster
    nextTick(() => {
      if (imgNode.value) {
        imgNode.value.getNode().cache()
        imgNode.value.getNode().drawHitFromCache()
      }
    })
    // document.body.appendChild(render)
    // render.style.position = 'absolute'
    // render.style.left = '100px'
    // render.style.top = '100px'
  }
}
</script>
