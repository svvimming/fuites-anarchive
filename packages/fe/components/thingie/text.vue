<template>
  <v-text :config="textConfig" :key="key" />
</template>

<script setup>
// ======================================================================= Setup
const props = defineProps({
  parentConfig: {
    type: Object,
    required: true
  },
  options: {
    type: Object,
    required: false,
    default: () => ({})
  },
  text: {
    type: String,
    required: true
  }
})

// ======================================================================== Data
const key = ref(0)

// ==================================================================== Computed
const textConfig = computed(() => ({
  thingie_id: props.parentConfig.thingie_id,
  width: props.parentConfig.width,
  height: props.parentConfig.height,
  text: props.text,
  ...props.options
}))

// ==================================================================== Watchers
watch(() => props.options, () => { key.value++ }, { deep: true })

</script>
