<template>
  <ZeroButton
    v-slot="{ loading }"
    class="stamp">

    <DashedBorderButtonPath :class="['svg-border', { active }]" />

    <SpinnerMaterialCircle v-if="loading && !disableLoader" />

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

  </ZeroButton>
</template>

<script setup>
// ======================================================================= Setup
defineProps({
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
  }
})
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.spinner {
  position: absolute;
  top: calc(50% - #{torem(6)}); // minus half dimension of loader
  left: calc(50% - #{torem(6)}); // minus half dimension of loader
  transform: translate(-50%, -50%);
}

.text {
  position: relative;
  color: white;
  line-height: 1.1;
  font-size: torem(32);
  transition: 200ms ease;
  transform: scale(0.925);
}

.stamp {
  position: relative;
  padding: 0 torem(26) torem(4) torem(26);
  transition: 200ms ease;
  filter: drop-shadow(0px 4px 4px rgba(0, 0, 0, 0));
  @include modalShadowLight;
  --stamp-color: #{$cove};
  &:before {
    content: '';
    position: absolute;
    left: torem(2);
    top: torem(2);
    width: calc(100% - torem(4));
    height: calc(100% - torem(4));
    border-top-left-radius: torem(20);
    border-bottom-right-radius: torem(20);
    background-color: white;
    box-shadow: 2px 2px 6px 0px white, -2px 2px 6px 0px white, 2px -2px 6px 0px white, -2px -2px 6px 0px white;
    transition: 200ms ease;
  }
  &:hover {
    :deep(path) {
      stroke-dashoffset: 20%;
    }
    .text {
      transform: scale(1);
    }
  }
  &.active {
    @include modalShadow;
    :deep(path) {
      stroke-dasharray: 3 3;
    }
  }
  .text {
    color: var(--stamp-color);
  }
  .svg-border {
    :deep(path) {
      stroke: var(--stamp-color);
    }
  }
  &.active {
    &:before {
      background-color: var(--stamp-color);
      box-shadow: 2px 2px 6px 0px rgba(white, 0);
    }
    .text {
      color: white;
    }
  }
}
</style>

