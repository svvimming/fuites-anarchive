<template>
  <ZeroButton
    v-slot="{ loading }"
    :class="['dashed-button', { active }]"
    :style="{ width: `${width + 2}px` }">

    <SvgDashedBorderVariableWidth
      :width="width"
      :flat-dashes="flatDashes"
      :class="['border', `flat-dash-${flatDashes}`]" />

    <SpinnerMaterialCircle v-if="loading && !disableLoader" />

    <slot name="icon-before" />

    <div v-if="text" class="text">
      {{ text }}
    </div>

    <div v-else class="stylized text">
      <ClientOnly>
        <span
          v-for="(item, i) in stylized"
          :key="`letter-${i}`"
          :class="item.classes">
          {{ item.letter }}
        </span>
      </ClientOnly>
    </div>

    <slot name="icon-after" />

  </ZeroButton>
</template>

<script setup>
// ======================================================================= Setup
const props = defineProps({
  text: {
    type: String,
    required: false,
    default: ''
  },
  disableLoader: {
    type: Boolean,
    required: false,
    default: false
  },
  active: {
    type: Boolean,
    required: false,
    default: false
  },
  stylized: {
    type: Array,
    required: false,
    default: () => []
  },
  flatDashes: {
    type: Number,
    required: false,
    default: 3
  }
})

// ==================================================================== Computed
const width = computed(() => {
  switch (props.flatDashes) {
    case 3:
      return 136
    case 4:
      return 160
    case 5:
      return 184
    default:
      return 138
  }
})
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.dashed-button {
  --two-tone-a: #{$drippyCore};
  --two-tone-b: white;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: torem(42);
  border-radius: torem(20);
  background-color: var(--two-tone-b);
  &:hover,
  &.active {
    .border.flat-dash-3 {
      :deep(.rect) {
        stroke-dashoffset: -16;
      }
    }
    .border.flat-dash-4 {
      :deep(.rect) {
        stroke-dashoffset: -13;
      }
    }
  }
  .text {
    color: var(--two-tone-a);
  }
  :deep(.icon) {
    path,
    circle {
      fill: var(--two-tone-a);
    }
  }
  .border {
    :deep(.rect) {
      stroke: var(--two-tone-a);
    }
  }
  &.active {
    background-color: var(--two-tone-a);
    .text {
      color: var(--two-tone-b);
    }
    :deep(.icon) {
      path, circle { fill: var(--two-tone-b); }
    }
  }
}

.spinner {
  position: absolute;
  top: calc(50% - #{torem(6)}); // minus half dimension of loader
  left: calc(50% - #{torem(6)}); // minus half dimension of loader
  transform: translate(-50%, -50%);
}

.text {
  position: relative;
  line-height: 1.1;
  font-size: torem(16);
  font-family: 'Nanum Myeongjo', serif;
  font-weight: 700;
  transition: 200ms ease;
}

.stylized {
  span {
    font-size: torem(20);
  }
}

.border {
  position: absolute;
  top: 0;
  left: 0;
  :deep(.rect) {
    transition: 200ms ease;
  }
  &.flat-dash-3 {
    :deep(.rect) {
      stroke-dasharray: 18 8;
      stroke-dashoffset: 10;
    }
  }
  &.flat-dash-4 {
    :deep(.rect) {
      stroke-dasharray: 18 8;
      stroke-dashoffset: 14;
    }
  }
  &.flat-dash-5 {
    :deep(.rect) {
      stroke-dasharray: 18 8;
      stroke-dashoffset: 16;
    }
  }
}
</style>

