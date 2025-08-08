<template>
  <v-group
    ref="groupRef"
    :config="groupConfig"
    __use-strict-mode
    @dragmove="drag($event)">

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
      @mouseup="handleNavigate('pointer')"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleNavigate('touch')"
      @dblclick="handleDeleteManualPortal"
      @dbltap="handleDeleteManualPortal" />

  </v-group>
</template>

<script setup>
// ======================================================================= Setup
const props = defineProps({
  portal: {
    type: Object,
    required: true
  }
})

// ======================================================================== Data
const config = useRuntimeConfig()
const verseStore = useVerseStore()
const { verse, page } = storeToRefs(verseStore)
const generalStore = useGeneralStore()
const { baseUrl, portalEditing } = storeToRefs(generalStore)
const alertStore = useZeroAlertStore()

const groupRef = ref(null)
const imageRef = ref(null)
const pulseRef = ref(null)
const portalRef = ref(null)
const navigateArmed = ref(false)
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
const bounds = computed(() => page.value.data.bounds || { x: 0, y: 0 })

const destPrintId = computed(() => {
  const prints = thatVertex.value.page_ref?.print_refs || []
  return prints[prints.length - 1]
})

const groupConfig = computed(() => ({
  draggable: portalEditing.value,
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
  destination: thatVertex.value.location,
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
 * @method handleTouchStart
 */

const handleTouchStart = () => {
  hovering.value = true
  navigateArmed.value = true
}

/**
 * @method handleTouchMove
 */

const handleTouchMove = () => {
  navigateArmed.value = false
}

/**
 * @method handleNavigate
 */

const handleNavigate = async type => {
  hovering.value = false
  if (type === 'touch' && !navigateArmed.value) { return }
  if (verseName.value && thatVertex.value && !portalEditing.value) {
    const newRoute = `/${verseName.value}/${thatVertex.value.location}`
    await navigateTo({ path: newRoute })
  }
}

/**
 * @method handleDeleteManualPortal
 */

const handleDeleteManualPortal = () => {
  if (portalEditing.value && props.portal.manual) {
    verseStore.setPortalToDelete(props.portal._id)
    alertStore.openAlert('delete-portal-alert')
  }
}

/**
 * @method drag
 */

const drag = e => {
  const attrs = e.target.attrs
  const newVerts = []
  for (let i = 0; i < 2; i++) {
    const v = vertices.value[i]
    if (v.location === page.value.data.name) {
      newVerts.push({
        ...v,
        at: {
          x: Math.max(0, Math.min(attrs.x, bounds.value.x)),
          y: Math.max(0, Math.min(attrs.y, bounds.value.y))
        }
      })
    } else {
      newVerts.push(Object.assign({}, v))
    }
  }
  verseStore.initPortalUpdate({
    _id: props.portal._id,
    vertices: newVerts
  })
}

/**
 * @method loadImage
 */

const loadImage = () => {
  imageLoading.value = true
  const img = document.createElement('img')
  if (config.public.serverEnv !== 'development') {
    img.crossOrigin = 'anonymous'
  }
  img.onload = function () {
    imageLoadError.value = false
    imageLoading.value = false
    image.value = img
  }
  img.onerror = function () {
    imageLoadError.value = true
    imageLoading.value = false
  }
  const env = config.public.serverEnv
  if (env === 'development') {
    img.src = `${baseUrl.value}/prints/${destPrintId.value}.png`
  } else if (env === 'stable') {
    img.src = `https://${config.public.doSpacesBucketName}.${config.public.doSpacesEndpoint}/stable/prints/${destPrintId.value}.png`
  } else {
    img.src = `https://${config.public.doSpacesBucketName}.${config.public.doSpacesEndpoint}/prints/${destPrintId.value}.png`
  }
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
