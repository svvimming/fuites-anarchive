<template>
  <div :class="['verse-portal', { active }]" :style="colorStyles">
    <!-- --------------------------------------------------------------- Orb -->
    <div class="orb"></div>

    <div :class="['label-container', `offset__${offset}`]">
      <!-- ----------------------------------------------------- Label Title -->
      <div class="verse-title">
        <span class="label">{{ verse.name }}</span>
      </div>
      <!-- ------------------------------------------------------- Indicator -->
      <svg
        width="4"
        :height="height"
        :viewBox="viewbox"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="indicator"
        :style="{
          transform: `rotate(${props.labelAngle + 90}deg)`
        }">
        <line
          x1="2"
          y1="0"
          x2="2"
          y2="80"
          stroke="#B3B9CC"
          stroke-width="2"
          stroke-linecap="round"
          stroke-dasharray="4 8 12 16 5 4 8 3" />
      </svg>
    </div>

  </div>
</template>

<script setup>
// ======================================================================= Setup
const props = defineProps({
  verse: {
    type: Object,
    required: true
  },
  active: {
    type: Boolean,
    required: true
  }
})

// ======================================================================== Data
const offset = ref('middle')

// ==================================================================== Computed
const height = computed(() => offset.value === 'middle' ? 50 : 76)
const viewbox = computed(() => `0 0 4 ${height.value}`)

// ===================================================================== Methods
const colorStyles = computed(() => {
  return {
    '--orb-primary-color': props.verse.average_colors?.primary,
    '--orb-secondary-color': props.verse.average_colors?.secondary
  }
})

const setOffsetPosition = () => {
  const offsets = ['left', 'middle', 'right']
  const index = Math.floor(Math.random() * 3)
  offset.value = offsets[index]
}

// ======================================================================= Hooks
onMounted(() => { setOffsetPosition() })
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.verse-portal {
  --orb-primary-color: #6B7080;
  --orb-secondary-color: #E5FF00;
  position: absolute;
  left: 0;
  top: 50%;
  z-index: 1;
  .orb {
    &:before {
      background-color: var(--orb-primary-color);
      filter: drop-shadow(0 0 torem(16) var(--orb-secondary-color)) blur(torem(10));
    }
    &:after {
      background: radial-gradient(circle, var(--orb-primary-color) 10%, var(--orb-secondary-color) 30%, rgba(255, 255, 255, 0) 66%);
    }
  }
  .verse-title,
  .indicator {
    opacity: 0;
  }
  &.active {
    z-index: 2;
    .orb {
      transform: scale(1.5);
      &:after {
        animation: hoverRing 2000ms ease-in-out infinite;
      }
    }
    .verse-title,
    .indicator {
      opacity: 1;
    }
  }
}

.orb {
  position: relative;
  width: torem(40);
  height: torem(40);
  border-radius: 50%;
  transition: transform 200ms ease-in-out;
  &:before,
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }
  &:after {
    opacity: 0;
  }
}

.label-container {
  position: absolute;
  bottom: calc(100% + torem(50));
  transform: translate(-50%, -50%);
  &.offset__left {
    left: calc(50% + torem(-75));
    .indicator {
      transform: rotate(-39deg);
    }
  }
  &.offset__middle {
    left: 50%;
  } 
  &.offset__right {
    left: calc(50% + torem(75));
    .indicator {
      transform: rotate(39deg);
    }
  }
}

.verse-title {
  position: relative;
  border-radius: torem(25);
  background-color: $drippyCore;
  padding: torem(8) torem(16);
  transition: opacity 200ms ease-in-out;
}

.label {
  display: flex;
  font-size: torem(16);
  font-weight: 600;
  line-height: 1.2;
  color: white;
  white-space: nowrap;
}

.indicator {
  position: absolute;
  top: 100%;
  left: calc(50% - 2px);
  transform-origin: center top;
  transition: opacity 200ms ease-in-out;
}

.verse-settings-button {
  position: absolute;
  padding: torem(6);
  bottom: 50%;
  left: calc(100% - torem(15));
  width: torem(30);
  height: torem(30);
  &:before {
    transform: scale(0.99);
  }
  :deep(.svg-border) {
    rect {
      x: 1.5;
      y: 1.5;
      width: torem(39);
      height: torem(39);
      stroke-width: 3;
      stroke: $drippyCore;
    }
  }
  .icon-ellipsis {
    :deep(circle) {
      fill: $drippyCore;
    }
  }
}

@keyframes hoverRing {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}
</style>
