<template>
  <ZeroButton
    v-slot="{ loading }"
    class="icon-button">

    <DashedBorderCircle
      :active="active"
      :class="['svg-border', { active }]" />

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
  :deep(path) {
    transition: 200ms ease;
  }
}

// .color-cove {
//   &.active {
//     .svg-border {
//       width: calc(100% + torem(4));
//       height: calc(100% + torem(4));
//       :deep(path) {
//         fill: $cove;
//         stroke-width: 6;
//       }
//     }
//   }
// }
</style>

