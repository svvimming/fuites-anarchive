<template>
  <ZeroButton
    v-slot="{ loading }"
    :force-loading="forceLoading"
    :force-disabled="forceDisabled"
    :class="['icon-button', { active }]"
    :data-tooltip="tooltip">

    <DashedBorderCircle
      :active="active"
      class="svg-border"
      :data-tooltip="tooltip" />

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
// ///////////////////////////////////////////////////////////////////// General
.icon-button {
  position: relative;
  padding: torem(8.5);
  width: torem(40);
  height: torem(40);
  --two-tone-a: #{$effy};
  --two-tone-b: white;
  &:before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: var(--two-tone-b);
    border-radius: 50%;
    opacity: 0.95;
  }
  .svg-border {
    :deep(circle),
    :deep(rect),
    :deep(path) {
      transition: 200ms ease;
      stroke: var(--two-tone-a);
    }
  }
  &:hover {
    .svg-border {
      :deep(circle),
      :deep(rect),
      :deep(path) {
        stroke-dashoffset: 20%;
      }
    }
  }
  &.active {
    &:before {
      background-color: var(--two-tone-a);
    }
    .svg-border {
      :deep(circle),
      :deep(rect),
      :deep(path) {
        stroke: var(--two-tone-b);
      }
    }
  }
}

.spinner {
  position: absolute;
  top: calc(50% - #{torem(6)}); // minus half dimension of loader
  left: calc(50% - #{torem(6)}); // minus half dimension of loader
  transform: translate(-50%, -50%);
  + .slot {
    opacity: 0;
  }
}

.slot {
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}
</style>

