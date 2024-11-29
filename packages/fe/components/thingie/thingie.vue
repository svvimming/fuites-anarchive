<template>
  <v-group
    :config="config"
    __use-strict-mode
    @dragmove="drag($event)"
    @dblclick="doubleClick"
    @wheel="wheel($event)">
    
    <ThingieImage
      v-if="type === 'image'"
      :file-ref="thingie.file_ref"
      :parent-config="config"
      :options="highlight"
      :clip-active="thingie.clip"
      :path="thingie.path_data" />

    <ThingieSound
      v-if="type === 'sound'"
      :file-ref="thingie.file_ref"
      :parent-config="config"
      :options="highlight"
      :gain="thingie.gain || 1"
      :path="thingie.path_data"
      :colors="thingie.colors"
      :position="thingie.at"
      :stoke-width="thingie.stroke_width" />

    <ThingieText
      v-if="type === 'text'"
      :text="thingie.text"
      :parent-config="config"
      :options="highlight"
      :hidden="editMode" />

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
  }
})

// ======================================================================== Data
const generalStore = useGeneralStore()
const { dragndrop } = storeToRefs(generalStore)
const verseStore = useVerseStore()
const { page } = storeToRefs(verseStore)
const collectorStore = useCollectorStore()
const { editing } = storeToRefs(collectorStore)

const selectionColor = useGetSelectionColor(props.thingie.colors)

// ==================================================================== Computed
const bounds = computed(() => page.value.data.bounds || { x: 0, y: 0 })
const id = computed(() => props.thingie._id)
const type = computed(() => props.thingie.thingie_type)
const at = computed(() => props.thingie.at)
const opacity = computed(() => props.thingie.opacity || 1)
const editMode = computed(() => editing.value === props.thingie._id)
const highlight = computed(() => editMode.value ? { shadowColor: selectionColor, shadowBlur: 10 } : {} )
const config = computed(() => ({
  ...at.value,
  thingie_id: id.value,
  draggable: !dragndrop.value,
  opacity: opacity.value,
  offsetX: at.value.width * 0.5,
  offsetY: at.value.height * 0.5 
}))

// ===================================================================== Methods
/**
 * @method drag
 */

const drag = e => {
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

/**
 * @method doubleClick
 */

const doubleClick = () => {
  if (editing.value !== props.thingie._id) {
    collectorStore.setEditing(props.thingie._id)
  }
}

/**
 * @method wheel
 */

const wheel = e => {
  e.evt.preventDefault()
  if (editMode.value && type.value !== 'text') {
    e.cancelBubble = true
    const attrs = e.target.attrs
    const width = attrs.width || at.value.width
    const height = attrs.height || at.value.height
    const newWidth = Math.max(width - e.evt.deltaY, 1)
    const newHeight = Math.max(height - (e.evt.deltaY * (height / width)), 1)
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
