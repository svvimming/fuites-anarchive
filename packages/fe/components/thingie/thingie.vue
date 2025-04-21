<template>
  <v-group
    v-if="id !== 'new-text-thingie'"
    :config="config"
    __use-strict-mode
    @dragmove="drag($event)"
    @dblclick="doubleClick"
    @dbltap="doubleTap"
    @wheel="wheel($event)"
    @touchmove="handleTouchMove($event)"
    @touchend="handleTouchEnd($event)">

    <v-path
      v-if="!loaded && type !== 'sound'"
      :config="loadingSvg" />
    
    <ThingieImage
      v-if="type === 'image'"
      :file-ref="thingie.file_ref"
      :parent-config="config"
      :options="highlight"
      :clip-active="thingie.clip"
      :path="thingie.path_data"
      @loaded="handleSetLoaded" />

    <ThingieSound
      v-if="type === 'sound'"
      :file-ref="thingie.file_ref"
      :parent-config="config"
      :options="highlight"
      :gain="thingie.gain || 1"
      :path="thingie.path_data"
      :colors="thingie.colors"
      :position="thingie.at"
      :location="thingie.location"
      :stroke-width="thingie.stroke_width" />

    <ThingieText
      v-if="type === 'text'"
      :text="thingie.text"
      :parent-config="config"
      :options="highlight"
      :hidden="editMode"
      @loaded="handleSetLoaded" />

  </v-group>
</template>

<script setup>
// ====================================================================== Import
import { useThrottleFn } from '@vueuse/core'

// ======================================================================= Props
const props = defineProps({
  thingie: {
    type: Object,
    required: true
  },
  forceBounds: {
    type: [Object, Boolean],
    required: false,
    default: false
  }
})

const emit = defineEmits(['record-load'])

// ======================================================================== Data
const generalStore = useGeneralStore()
const { dragndrop, activeModes, small } = storeToRefs(generalStore)
const verseStore = useVerseStore()
const { page, sceneData } = storeToRefs(verseStore)
const collectorStore = useCollectorStore()
const { editing } = storeToRefs(collectorStore)
const pocketStore = usePocketStore()
const { authenticated } = storeToRefs(pocketStore)

const loaded = ref(false)
const selectionColor = useGetSelectionColor(props.thingie.colors)
const lastTouchDistance = ref(0)
const lastTouchAngle = ref(0)
const forceDisableDrag = ref(false)

// ==================================================================== Computed
const bounds = computed(() => props.forceBounds || page.value.data.bounds || { x: 0, y: 0 })
const id = computed(() => props.thingie._id)
const type = computed(() => props.thingie.thingie_type)
const at = computed(() => props.thingie.at)
const opacity = computed(() => props.thingie.opacity || 1)
const editMode = computed(() => editing.value === props.thingie._id)
const highlight = computed(() => editMode.value ? { shadowColor: selectionColor, shadowBlur: 10 } : {} )
const draggable = computed(() => authenticated.value && !dragndrop.value && (!small.value || activeModes.value.mobileEdit))
const config = computed(() => ({
  ...at.value,
  thingie_id: id.value,
  draggable: draggable.value && !forceDisableDrag.value,
  listening: !props.thingie.locked,
  opacity: opacity.value,
  offsetX: at.value.width * 0.5,
  offsetY: at.value.height * 0.5 
}))

const loadingSvg = computed(() => {
  let path = ''
  if (type.value === 'text') {
    path = 'M 4 0 H 196 C 198 0 200 2 200 4 V 196 C 200 198 198 200 196 200 H 4 C 2 200 0 198 0 196 V 4 C 0 2 2 0 4 0 Z'
  } else {
    path = useGetSvgPath(props.thingie.path_data, {
      closed: true,
      rescale: {
        x: at.value.width,
        y: at.value.height
      }
    })
  }
  return {
    data: path,
    fill: '#c2c2c2',
    opacity: 0.25
  }
})

watch(draggable, val => {
  console.log('thingie.draggable', val)
}, { immediate: true })
// ===================================================================== Methods
/**
 * @method handleSetLoaded
 */

const handleSetLoaded = val => {
  loaded.value = val
  emit('record-load', id.value)
}

/**
 * @method drag
 */

const drag = e => {
  console.log('thingie.drag', e)
  if (authenticated.value) {
    const attrs = e.target.attrs
    update({
      at: {
        x: Math.max(0, Math.min(attrs.x, bounds.value.x)),
        y: Math.max(0, Math.min(attrs.y, bounds.value.y)),
        width: attrs.width,
        height: attrs.height,
        rotation: attrs.rotation
      }
    })
  }
}

/**
 * @method doubleClick
 */

const doubleClick = () => {
  if (authenticated.value && editing.value !== props.thingie._id) {
    collectorStore.setEditing(props.thingie._id)
  }
}

/**
 * @method doubleTap
 */

const doubleTap = () => {
  if (activeModes.value.mobileEdit) {
    doubleClick()
  }
}

/**
 * @method wheel
 */

const wheel = e => {
  e.evt.preventDefault()
  if (authenticated.value && editMode.value && type.value !== 'text') {
    e.cancelBubble = true
    const attrs = e.target.attrs
    const width = attrs.width || at.value.width
    const height = attrs.height || at.value.height
    const min = 0.0059 * bounds.value.x * (1 / sceneData.value.scale)
    const aspect = height / width
    const newWidth = Math.max(width - e.evt.deltaY, min)
    const newHeight = Math.max(height - (e.evt.deltaY * aspect), min * aspect)
    update({
      at: {
        x: Math.max(0, Math.min(at.value.x, bounds.value.x)),
        y: Math.max(0, Math.min(at.value.y, bounds.value.y)),
        width: newWidth,
        height: newHeight,
        rotation: at.value.rotation
      }
    })
  }
}

/**
 * @method handleTouchMove
 */

const handleTouchMove = e => {
  if (activeModes.value.mobileEdit && editMode.value) {
    e.evt.preventDefault()
    const touch1 = e.evt.touches[0]
    const touch2 = e.evt.touches[1]
    if (touch1 && !touch2 && forceDisableDrag.value) {
      forceDisableDrag.value = false
      return
    }
    if (touch1 && touch2) {
      if (!forceDisableDrag.value) { forceDisableDrag.value = true }
      const p1 = { x: touch1.clientX, y: touch1.clientY }
      const p2 = { x: touch2.clientX, y: touch2.clientY }
      
      // Calculate current angle between touch points
      const currentAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI)
      
      // Calculate distance between touch points
      const distance = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
      
      if (!lastTouchDistance.value) {
        lastTouchDistance.value = distance
        lastTouchAngle.value = currentAngle
        return
      }
      
      // Calculate rotation change
      const rotationDelta = currentAngle - lastTouchAngle.value
      lastTouchAngle.value = currentAngle
      
      // Handle scaling
      const delta = distance - lastTouchDistance.value
      lastTouchDistance.value = distance

      const currentWidth = at.value.width
      const currentHeight = at.value.height
      update({
        at: Object.assign({}, at.value, {
          width: currentWidth + delta,
          height: currentHeight + (delta * currentHeight / currentWidth),
          ...(Math.abs(rotationDelta) > 1 && { rotation: at.value.rotation + rotationDelta })
        })
      })
    }
  }
}

/**
 * @method handleTouchEnd
 */

const handleTouchEnd = () => {
  lastTouchDistance.value = 0
  lastTouchAngle.value = 0
  forceDisableDrag.value = false
}

/**
 * @method update
 */

const update = useThrottleFn(data => {
  collectorStore.initThingieUpdate(Object.assign(data, { _id: id.value }))
}, 5)
</script>
