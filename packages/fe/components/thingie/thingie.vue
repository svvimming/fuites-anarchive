<template>
  <v-group
    v-if="id !== 'new-text-thingie'"
    :config="config"
    __use-strict-mode
    @dragmove="drag($event)"
    @dblclick="doubleClick"
    @wheel="wheel($event)">

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
const { dragndrop } = storeToRefs(generalStore)
const verseStore = useVerseStore()
const { page, sceneData } = storeToRefs(verseStore)
const collectorStore = useCollectorStore()
const { editing } = storeToRefs(collectorStore)
const pocketStore = usePocketStore()
const { authenticated } = storeToRefs(pocketStore)

const loaded = ref(false)
const selectionColor = useGetSelectionColor(props.thingie.colors)

// ==================================================================== Computed
const bounds = computed(() => props.forceBounds || page.value.data.bounds || { x: 0, y: 0 })
const id = computed(() => props.thingie._id)
const type = computed(() => props.thingie.thingie_type)
const at = computed(() => props.thingie.at)
const opacity = computed(() => props.thingie.opacity || 1)
const editMode = computed(() => editing.value === props.thingie._id)
const highlight = computed(() => editMode.value ? { shadowColor: selectionColor, shadowBlur: 10 } : {} )
const config = computed(() => ({
  ...at.value,
  thingie_id: id.value,
  draggable: authenticated.value && !dragndrop.value,
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
 * @method update
 */

const update = useThrottleFn(data => {
  collectorStore.initThingieUpdate(Object.assign(data, { _id: id.value }))
}, 5)
</script>
