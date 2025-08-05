<template>
  <v-group>
    <v-path :config="pathConfig" :key="key" />
    <v-path :config="shadowConfig" />
  </v-group>
</template>

<script setup>
// ====================================================================== Import
import { useThrottleFn } from '@vueuse/core'

// ======================================================================= Setup
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
  gain: {
    type: Number,
    required: false,
    default: 1
  },
  pitch: {
    type: Number,
    required: false,
    default: 0
  },
  path: {
    type: String,
    required: true,
    default: ''
  },
  colors: {
    type: Array,
    required: false,
    default: () => []
  },
  position: {
    type: Object,
    required: true,
    default: () => ({
      x: 0, y: 0
    })
  },
  location: {
    type: String,
    required: true
  },
  strokeWidth: {
    type: Number,
    required: false,
    default: 3
  },
  forceOpacity: {
    type: [Number, Boolean],
    required: false,
    default: false
  }
})

// ======================================================================== Data
const config = useRuntimeConfig()
const source = ref(false)
const player = ref(false)
const gainNode = ref(false)
const amplitude = ref(0)
const mousemoveEventListener = ref(false)
const touchmoveEventListener = ref(false)
const key = ref(0)
const verseStore = useVerseStore()
const { sceneData, colorSelectorHex } = storeToRefs(verseStore)
const mixerStore = useMixerStore()
const { audioContext, mixer } = storeToRefs(mixerStore)
const generalStore = useGeneralStore()
const { baseUrl, small } = storeToRefs(generalStore)
const collectorStore = useCollectorStore()
const { editing } = storeToRefs(collectorStore)

// ==================================================================== Computed
const svgPath = computed(() => useGetSvgPath(props.path, { closed: false }) || '')
const playState = computed(() => audioContext.value?.state || 'suspended')
const opacity = computed(() => playState.value === 'running' ? 0.4 + (amplitude.value * 0.6) : 0.4)
const color = computed(() => editing.value === props.parentConfig.thingie_id && colorSelectorHex.value.sound ? colorSelectorHex.value.sound : props.colors[props.colors.length - 1] || '#46424d')
const pathConfig = computed(() => ({
  thingie_id: props.parentConfig.thingie_id,
  scaleX: props.parentConfig.width / 200,
  scaleY: props.parentConfig.height / 200,
  data: svgPath.value,
  stroke: color.value,
  strokeWidth: props.strokeWidth,
  opacity: props.forceOpacity || opacity.value,
  ...props.options
}))
const shadowConfig = computed(() => ({
  thingie_id: props.parentConfig.thingie_id,
  scaleX: props.parentConfig.width / 200,
  scaleY: props.parentConfig.height / 200,
  data: svgPath.value,
  stroke: '#FFFFFF',
  strokeWidth: Math.max(props.strokeWidth, 40),
  opacity: 0
}))
    
// ==================================================================== Watchers
watch(() => props.options, () => { key.value++ }, { deep: true })

watch(audioContext, (val) => {
  if (val) { initSoundThingie() }
})

watch(() => props.gain, (val) => {
  if (gainNode.value) {
    gainNode.value.gain.value = amplitude.value * val
  }
})

watch(() => props.pitch, (val) => {
  if (source.value) {
    source.value.playbackRate.value = Math.pow(2, (val / 1200))
  }
})

// ===================================================================== Methods
/**
 * @method calculateMouseDistance
 */

const calculateMouseDistance = e => {
  const deltaX = props.position.x - (e.clientX / sceneData.value.scale) + sceneData.value.x
  const deltaY = props.position.y - (e.clientY / sceneData.value.scale) + sceneData.value.y
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  const amp = Math.exp(-0.005 * distance)
  gainNode.value.gain.value = amp * props.gain
  amplitude.value = amp
}

/**
 * @method calculateScreenCenterDistance
 */

const calculateScreenCenterDistance = () => {
  const deltaX = props.position.x - (window.innerWidth * 0.5 / sceneData.value.scale) + sceneData.value.x
  const deltaY = props.position.y - (window.innerHeight * 0.5 / sceneData.value.scale) + sceneData.value.y
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  const amp = Math.exp(-0.005 * distance)
  gainNode.value.gain.value = amp * props.gain
  amplitude.value = amp
}

/**
 * @method initSoundThingie
 */

const initSoundThingie = () => {
  if (props.location === 'pocket') { return }
  player.value = document.createElement('audio')
  player.value.crossOrigin = 'anonymous'
  player.value.loop = true
  const fileRef = props.fileRef
  player.value.src = config.public.serverEnv !== 'development' ? fileRef.file_url : '/winter-behaviour.mp3' //: `${baseUrl.value}/uploads/${fileRef._id}.${fileRef.file_ext}`
  source.value = audioContext.value.createMediaElementSource(player.value)
  gainNode.value = audioContext.value.createGain()
  gainNode.value.gain.value = 0
  source.value.playbackRate.value = Math.pow(2, (props.pitch / 1200))
  source.value.connect(gainNode.value).connect(mixer.value) // audioContext.value.destination
  if (small.value) {
    touchmoveEventListener.value = useThrottleFn(() => { calculateScreenCenterDistance() }, 100)
    window.addEventListener('touchmove', touchmoveEventListener.value)
  } else {
    mousemoveEventListener.value = useThrottleFn(e => { calculateMouseDistance(e) }, 100)
    window.addEventListener('mousemove', e => { mousemoveEventListener.value(e) })
  }
  player.value.play()
}

// ======================================================================= Hooks
onMounted(() => {
  if (audioContext.value) { initSoundThingie() }
})

onBeforeUnmount(() => {
  if (player.value) { player.value.pause() }
  if (mousemoveEventListener.value) { window.removeEventListener('mousemove', mousemoveEventListener.value) }
  if (touchmoveEventListener.value) { window.removeEventListener('touchmove', touchmoveEventListener.value) }
})
</script>
