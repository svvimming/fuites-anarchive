<template>
  <v-image v-if="raster" :config="textConfig" :key="key" />
</template>

<script setup>
// ====================================================================== Import
import html2canvas from 'html2canvas'

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

// ======================================================================== Data
const key = ref(0)
const raster = ref(false)
const loading = ref(true)

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
  loading.value = true
  const div = document.createElement('div')
  div.innerHTML = props.text
  div.classList.add('thingie-rich-text')
  div.style.width = `${textConfig.value.width}px`
  div.style.height = `${textConfig.value.height}px`
  div.style.position = 'absolute'
  div.style.fontSize = props.text.fontsize + 'px'
  div.style.lineHeight = 1
  div.style.whiteSpace= 'break-spaces'
  div.style.wordWrap = 'break-word'
  // div.style.left = '0px'
  // div.style.top = '0px'
  document.body.appendChild(div)
  html2canvas(div, {
    width: textConfig.value.width,
    height: textConfig.value.height,
    scale: 4,
    backgroundColor: 'rgba(0,0,0,0)',
  }).then((cnv) => {
    raster.value = cnv
    key.value++
    div.remove()
    loading.value = false
  })
}
</script>
