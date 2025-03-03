<template>
  <v-group
    ref="groupRef"
    :config="groupConfig">

    <v-image
      v-if="image"
      ref="imageRef"
      :config="imageConfig" />

    <v-circle ref="pulseRef" :config="pulseConfig" />

    <v-circle
      ref="portalRef"
      :config="portalConfig"
      @mouseover="hovering = true"
      @mouseout="hovering = false"
      @click="handlePortalClick" />

  </v-group>
</template>

<script setup>
import { onBeforeMount } from 'vue';

// ======================================================================= Setup
const props = defineProps({
  portal: {
    type: Object,
    required: true
  }
})

// ======================================================================== Data
const verseStore = useVerseStore()
const { verse, page } = storeToRefs(verseStore)
const generalStore = useGeneralStore()
const { baseUrl } = storeToRefs(generalStore)

const groupRef = ref(null)
const imageRef = ref(null)
const pulseRef = ref(null)
const portalRef = ref(null)
const imageLoadError = ref(false)
const imageLoading = ref(false)
const image = ref(false)
const hovering = ref(false)
const animation = ref(false)
const radius = 12 // portal radius

// ==================================================================== Computed
const verseName = computed(() => verse.value.data?.name)
const vertices = computed(() => props.portal.vertices)
const colors = computed(() => props.portal.thingie_ref?.colors || [])
const thisVertex = computed(() => vertices.value.find(vertex => vertex.location === page.value.data.name))
const thatVertex = computed(() => vertices.value.find(vertex => vertex.location !== page.value.data.name))

const destPrintId = computed(() => {
  const prints = thatVertex.value.page_ref?.print_refs || []
  return prints[prints.length - 1]
})

const groupConfig = computed(() => ({
  x: thisVertex.value.at.x,
  y: thisVertex.value.at.y
}))

const imageConfig = computed(() => ({
  image: image.value,
  width: radius * 4,
  height: radius * 4,
  x: -2 * radius,
  y: -2 * radius,
  opacity: 0
}))

const pulseConfig = computed(() => ({
  radius,
  opacity: 0,
  fill: colors.value[2] || '#ffffff'
}))

const portalConfig = computed(() => ({
  radius,
  portal_id: props.portal._id,
  fillRadialGradientStartPoint: { x: 0, y: 0 },
  fillRadialGradientStartRadius: 0,
  fillRadialGradientEndPoint: { x: 0, y: 0 },
  fillRadialGradientEndRadius: radius,
  fillRadialGradientColorStops: [0.15, colors.value[0] || '#6c6575', 0.45, colors.value[1] || '#BDBBD7', 1.0, 'rgba(255, 255, 255, 0)']
}))

// ==================================================================== Watchers
watch(hovering, (val) => {
  const group = groupRef.value.getNode()
  const preview = imageRef.value?.getNode()
  const pulse = pulseRef.value.getNode()
  const prtl = portalRef.value.getNode()
  const scale = val ? 2.5 : 1
  const grad = val ? [0.075, colors.value[0] || '#6c6575', 0.33, colors.value[1] || '#BDBBD7', 1.0, 'rgba(255, 255, 255, 0)'] : [0.15, colors.value[0] || '#6c6575', 0.45, colors.value[1] || '#BDBBD7', 1.0, 'rgba(255, 255, 255, 0)']
  group.to({
    scaleX: scale,
    scaleY: scale,
    duration: 0.2,
    easing: Konva.Easings.EaseInOut
  })
  if (preview) {
    preview.to({
      opacity: val ? 1 : 0,
      duration: 0.2,
      easing: Konva.Easings.EaseInOut
    })
  }
  prtl.to({
    scaleX: scale,
    scaleY: scale,
    fillRadialGradientColorStops: grad,
    duration: 0.2,
    easing: Konva.Easings.EaseInOut
  })
  if (val) {
    animation.value.start()
  } else {
    animation.value.stop()
    pulse.opacity(0)
  }
})

watch(destPrintId, id => {
  if (id) {
    loadImage()
  } else {
    clearImage()
  }
})

// ===================================================================== Methods
/**
 * @method handlePortalClick
 */

const handlePortalClick = async () => {
  if (verseName.value && thatVertex.value) {
    const newRoute = `/${verseName.value}/${thatVertex.value.location}`
    await navigateTo({ path: newRoute })
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
  }
  img.onerror = function () {
    imageLoadError.value = true
    imageLoading.value = false
  }
  img.src = `${baseUrl.value}/prints/${destPrintId.value}.png`
}

/**
 * @method clearImage
 */

const clearImage = () => {
  if (image.value) {
    image.value.remove()
    image.value = false
  }
}

// ======================================================================= Hooks
onMounted(() => {
  // Initialize hover animation
  const pulse = pulseRef.value.getNode()
  animation.value = new Konva.Animation((frame) => {
    pulse.opacity(0.5 * Math.sin((frame.time * 2 * Math.PI - (Math.PI / 2)) / 2000) + 0.5)
  }, pulse.getLayer())
  // Load portal preview image
  if (destPrintId.value) { loadImage() }
})

onBeforeMount(() => { clearImage() })
</script>
