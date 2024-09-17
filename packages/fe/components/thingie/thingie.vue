<template>
  <v-group
    :config="config"
    __use-strict-mode>
    
    <ThingieImage
      v-if="type === 'image'"
      :file-ref="thingie.file_ref"
      :parent-config="config" />

  </v-group>
</template>

<script setup>
const props = defineProps({
  thingie: {
    type: Object,
    required: true
  }
})

// const generalStore = useGeneralStore()
// const { baseUrl } = storeToRefs(generalStore)

const type = computed(() => props.thingie.thingie_type)
const config = computed(() => ({
  width: props.thingie.width,
  height: props.thingie.width,
  draggable: true
}))
</script>
