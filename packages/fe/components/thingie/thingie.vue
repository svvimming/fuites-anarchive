<template>
  <v-group
    :config="config"
    __use-strict-mode
    @dragmove="drag($event)">
    
    <ThingieImage
      v-if="type === 'image'"
      :file-ref="thingie.file_ref"
      :parent-config="config" />

  </v-group>
</template>

<script setup>
// ====================================================================== Import
import { useThrottleFn } from '@vueuse/core'
const generalStore = useGeneralStore()
const { dragndrop } = storeToRefs(generalStore)

// ======================================================================= Props
const props = defineProps({
  thingie: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['initUpdate'])

// ==================================================================== Computed
const id = computed(() => props.thingie._id)
const type = computed(() => props.thingie.thingie_type)
const at = computed(() => props.thingie.at)
const config = computed(() => ({
  ...at.value,
  thingie_id: id.value,
  draggable: !dragndrop.value,
  dragBoundFunc: pos => ({
    x: Math.max(0, pos.x),
    y: Math.max(0, pos.y)
  })
}))

// ===================================================================== Methods
/**
 * @method drag
 */
const drag = e => {
  const attrs = e.target.attrs
  update({
    at: { x: attrs.x, y: attrs.y, width: attrs.width, height: attrs.height, rotation: attrs.rotation }
  })
}

/**
 * @method update
 */
const update = useThrottleFn(data => {
  emit('initUpdate', Object.assign(data, { _id: id.value }))
}, 5)
</script>
