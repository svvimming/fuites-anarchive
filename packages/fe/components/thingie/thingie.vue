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
const config = computed(() => ({ ...props.thingie.at, draggable: true }))

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
const update = data => {
  emit('initUpdate', Object.assign(data, { _id: id.value }))
}
</script>
