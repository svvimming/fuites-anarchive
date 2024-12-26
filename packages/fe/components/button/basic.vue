<template>
  <ZeroButton
    v-slot="{ loading }"
    :force-loading="forceLoading"
    :force-disabled="forceDisabled"
    :class="['basic-button', { active }, { [`theme__${theme}`]: theme }]"
    :data-tooltip="tooltip"
    v-bind="{ ...props }">

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
const props = defineProps({
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
  },
  theme: {
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

.basic-button.theme__verse {
  background-color: transparent;
  border-radius: 0;
  border-bottom: solid torem(0.5) rgba($woodsmoke, 0.5);
  &:first-child {
    border-top: solid torem(0.5) rgba($woodsmoke, 0.5);
  }
  .slot {
    display: flex;
    align-items: center;
    text-align: left;
    color: $woodsmoke;
    // :deep(svg) {
    //   width: torem(10);
    //   height: torem(10);
    //   margin-left: torem(6);
    // }
    // :deep(path) {
    //   fill: $woodsmoke;
    // }
  }
}
</style>
