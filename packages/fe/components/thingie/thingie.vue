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

const emit = defineEmits(['initUpdate'])

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
const editMode = computed(() => editing.value === props.thingie._id)
const highlight = computed(() => editMode.value ? { shadowColor: selectionColor, shadowBlur: 10 } : {} )
const config = computed(() => ({
  ...at.value,
  thingie_id: id.value,
  draggable: !dragndrop.value
}))

// ===================================================================== Methods
/**
 * @method drag
 */

const drag = e => {
  const attrs = e.target.attrs
  update({
    at: {
      x: Math.max(0, Math.min(attrs.x, bounds.value.x - attrs.width)),
      y: Math.max(0, Math.min(attrs.y, bounds.value.y - attrs.height)),
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
  if (editMode.value) {
    e.cancelBubble = true
    const attrs = e.target.attrs
    const width = attrs.width
    const height = attrs.height
    const newWidth = Math.max(width - e.evt.deltaY, 1)
    const newHeight = Math.max(height - (e.evt.deltaY * (height / width)), 1)
    const offsetX = (width - newWidth) * 0.5
    const offsetY = (height - newHeight) * 0.5
    update({
      at: {
        x: Math.max(0, Math.min(at.value.x + offsetX, bounds.value.x - newWidth)),
        y: Math.max(0, Math.min(at.value.y + offsetY, bounds.value.y - newHeight)),
        width: newWidth,
        height: newHeight,
        rotation: attrs.rotation
      }
    })
  }
}

/**
 * @method update
 */

const update = useThrottleFn(data => {
  emit('initUpdate', Object.assign(data, { _id: id.value }))
}, 5)
</script>
