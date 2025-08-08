<template>
  <div class="selector-button">

    <button
      v-for="option in options"
      :key="option"
      :class="[option]"
      @click="emit('selected', option)">
      {{ option }}
    </button>

  </div>
</template>

<script setup>
defineProps({
  options: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['selected'])
</script>

<style lang="scss" scoped>
.selector-button {
  button {
    color: $woodsmoke;
    padding: torem(8) torem(8);
    font-size: 8px;
  }
}
</style>
