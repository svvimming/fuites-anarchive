<template>
  <ZeroButton
    v-slot="{ loading }"
    :force-loading="forceLoading"
    :force-disabled="forceDisabled"
    :class="['basic-button', { active }]"
    :data-tooltip="tooltip">

    <SpinnerMaterialCircle
      v-if="loading && !disableLoader"
      :data-tooltip="tooltip" />

    <div v-else class="slot" :data-tooltip="tooltip">
      <slot :loading="loading" :data-tooltip="tooltip" />
    </div>

  </ZeroButton>
</template>

<script setup>
// ======================================================================= Setup
defineProps({
  disableLoader: {
    type: Boolean,
    required: false,
    default: false
  },
  forceLoading: {
    type: Boolean,
    required: false,
    default: false
  },
  forceDisabled: {
    type: Boolean,
    required: false,
    default: false
  },
  active: {
    type: Boolean,
    required: false,
    default: false
  },
  tooltip: {
    type: String,
    required: false,
    default: ''
  }
})
</script>

<style lang="scss" scoped>
.basic-button {
  background-color: $gullGray;
  border-radius: torem(10);
  padding: torem(10) torem(25);
}

.slot {
  font-size: torem(12);
  font-weight: 600;
  line-height: 1.4;
  color: white;
}
</style>
