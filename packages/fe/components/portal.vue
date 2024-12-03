<template>
  <v-group
    ref="groupRef"
    :config="groupConfig">
    <v-circle
      :config="portalConfig"
      @mouseover="hovering = true"
      @mouseout="hovering = false"
      @click="handlePortalClick" />
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
const verseStore = useVerseStore()
const { verse, page } = storeToRefs(verseStore)

const groupRef = ref(null)
const hovering = ref(false)

// ==================================================================== Computed
const verseName = computed(() => verse.value.data.name)
const vertices = computed(() => props.portal.vertices)
const colors = computed(() => props.portal.thingie_ref.colors || [])
const thisVertex = computed(() => vertices.value.find(vertex => vertex.location === page.value.data.name))
const thatVertex = computed(() => vertices.value.find(vertex => vertex.location !== page.value.data.name))
const groupConfig = computed(() => ({
  x: thisVertex.value.at.x,
  y: thisVertex.value.at.y
}))
const portalConfig = computed(() => ({
  radius: 12,
  fillRadialGradientStartPoint: { x: 0, y: 0 },
  fillRadialGradientStartRadius: 0,
  fillRadialGradientEndPoint: { x: 0, y: 0 },
  fillRadialGradientEndRadius: 12,
  fillRadialGradientColorStops: [0.1, colors.value[0], 0.3, colors.value[1], 0.66, 'rgba(255, 255, 255, 0)']
}))

// ==================================================================== Watchers
watch(hovering, (val) => {
  const group = groupRef.value.getNode()
  const scale = val ? 2.5 : 1
  group.to({
    scaleX: scale,
    scaleY: scale,
    duration: 0.2,
    easing: Konva.Easings.EaseInOut
  })
})

// ===================================================================== Methods
const handlePortalClick = async () => {
  if (verseName.value && thatVertex.value) {
    const newRoute = `/${verseName.value}/${thatVertex.value.location}`
    await navigateTo({ path: newRoute })
  }  
}
</script>
