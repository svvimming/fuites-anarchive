<template>
  <ZeroButton
    v-slot="{ loading }"
    :force-loading="forceLoading"
    :force-disabled="forceDisabled"
    :class="['icon-button', { active }, { disabled: forceDisabled }]">

    <DashedBorderCircle
      :active="active"
      class="svg-border" />

    <SpinnerMaterialCircle v-if="loading && !disableLoader" />

    <div v-else class="slot">
      <slot :loading="loading" />
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
  --two-tone-a: #{$drippyCore};
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
    &:not(.disabled) {
      .svg-border {
        :deep(circle),
        :deep(rect),
        :deep(path) {
          stroke-dashoffset: -7;
        }
      }
    }
  }
  &.active {
    &:before {
      background-color: var(--two-tone-a);
    }
  }
  &.solid-outline {
    filter: none;
    &:before {
      box-shadow: none;
      left: torem(0.5);
      top: torem(0.5);
      width: calc(100% - torem(1));
      height: calc(100% - torem(1));
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

