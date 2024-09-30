<template>
  <ZeroButton
    v-slot="{ loading }"
    class="stamp">

    <DashedBorderButtonPath :class="['svg-border', { active }]" />

    <SpinnerMaterialCircle v-if="loading && !disableLoader" />

    <div v-if="text" class="text">
      <ClientOnly>
        <span
          v-for="i in text.length"
          :key="`letter-${i}`"
          :class="getTextClasses()">
          {{ text.charAt(i - 1) }}
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
  }
})

// ===================================================================== Methods
const getTextClasses = () => {
  let classes = Math.random() > 0.5 ? 'pt-sans' : 'pt-serif'
  if (Math.random() > 0.5) {
    classes = classes + ' italic'
  }
  if (Math.random() > 0.5) {
    classes = classes + ' bold'
  }
  return classes
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.spinner {
  position: absolute;
  top: calc(50% - #{torem(6)}); // minus half dimension of loader
  left: calc(50% - #{torem(6)}); // minus half dimension of loader
  transform: translate(-50%, -50%);
}

.rounded-border-left {
  &:before {
    border-top-left-radius: torem(20);
    border-bottom-right-radius: torem(20);
  }
}

.rounded-border-right {
  border-top-right-radius: torem(26);
  border-bottom-left-radius: torem(26);
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
  &:before {
    content: '';
    position: absolute;
    left: torem(2);
    top: torem(2);
    width: calc(100% - torem(4));
    height: calc(100% - torem(4));
    opacity: 0;
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
  &.color-cove {
    &:before {
      background-color: $cove;
    }
    .text {
      color: $cove;
    }
    &.active {
      &:before {
        opacity: 1;
      }
      .text {
        color: white;
      }
    }
  }
}
</style>

