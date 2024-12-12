<template>
  <ZeroButton
    v-slot="{ loading }"
    :force-loading="forceLoading"
    :force-disabled="forceDisabled"
    class="icon-button">

    <DashedBorderCircle
      :active="active"
      :class="['svg-border', { active }]"
      v-bind="{ 'data-tooltip': $attrs['data-tooltip'] }" />

    <SpinnerMaterialCircle
      v-if="loading && !disableLoader"
      v-bind="{ 'data-tooltip': $attrs['data-tooltip'] }" />

    <div v-else class="slot" v-bind="{ 'data-tooltip': $attrs['data-tooltip'] }">
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
  &:before {
    content: '';
    position: absolute;
    left: torem(2);
    top: torem(2);
    width: calc(100% - torem(4));
    height: calc(100% - torem(4));
    background-color: white;
    border-radius: 50%;
    opacity: 0.95;
  }
  &:hover {
    :deep(circle) {
      stroke-dashoffset: 20%;
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
  align-items: center;
}

.svg-border {
  :deep(circle) {
    transition: 200ms ease;
  }
}
</style>

