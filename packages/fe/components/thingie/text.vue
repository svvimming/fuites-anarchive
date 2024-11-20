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
    type: Object,
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
const generalStore = useGeneralStore()
const { siteData } = storeToRefs(generalStore)

// ==================================================================== Computed
const textConfig = computed(() => ({
  thingie_id: props.parentConfig.thingie_id,
  width: props.parentConfig.width,
  height: props.parentConfig.height,
  image: raster.value,
  visible: !props.hidden,
  ...props.options
}))

const fontface = computed(() => {
  const font = siteData.value?.settings?.fonts.find(item => item.class === props.text.family)
  if (font) { return font.fontFaceDeclaration }
  return 'Nanum Myeongjo'
})

// ==================================================================== Watchers
watch(() => props.options, () => { key.value++ }, { deep: true })
watch(() => props.text, () => { rasterizeText() })

// ======================================================================= Hooks
onMounted(() => { rasterizeText() })

// ===================================================================== Methods
const rasterizeText = () => {
  const pre = document.createElement('pre')
  pre.innerHTML = props.text.content
  pre.style.width = `${textConfig.value.width}px`
  pre.style.height = `${textConfig.value.height}px`
  pre.style.position = 'absolute'
  pre.style.display = 'flex'
  pre.style.color = props.text.color
  pre.style.fontSize = props.text.fontsize + 'px'
  pre.style.fontFamily = fontface.value
  pre.style.lineHeight = 1.5
  // pre.style.left = '0px'
  // pre.style.top = '0px'
  document.body.appendChild(pre)
  html2canvas(pre, {
    width: textConfig.value.width,
    height: textConfig.value.height,
    scale: 4,
    backgroundColor: 'rgba(0,0,0,0)',
  }).then((cnv) => {
    raster.value = cnv
    key.value++
    pre.remove()
  })
}
</script>
