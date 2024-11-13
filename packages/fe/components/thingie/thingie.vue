<template>
  <v-group
    :config="config"
    __use-strict-mode
    @dragmove="drag($event)"
    @dblclick="doubleClick">
    
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
const config = computed(() => ({
  ...at.value,
  thingie_id: id.value,
  draggable: !dragndrop.value
}))
const highlight = computed(() => {
  return editing.value === props.thingie._id ? {
    shadowColor: selectionColor,
    shadowBlur: 10
  } : {}
})

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
 * @method update
 */

const update = useThrottleFn(data => {
  emit('initUpdate', Object.assign(data, { _id: id.value }))
}, 5)
</script>
