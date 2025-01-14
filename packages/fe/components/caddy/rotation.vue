<template>
  <div :class="['rotation', { selected }]">
    <!-- ============================================= Unselected State Icon -->
    <button class="icon-fonts">
      <IconRotation />
    </button>

  </div>
</template>

<script setup>
// ======================================================================= Props
defineProps({
  selected: {
    type: Boolean,
    required: false,
    default: false
  }
})
</script>
