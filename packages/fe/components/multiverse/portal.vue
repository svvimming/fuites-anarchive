<template>
  <div class="verse-portal" :style="colorStyles">
    <!-- --------------------------------------------------------------- Orb -->
    <nuxt-link :to="to">
      <div class="orb"></div>
    </nuxt-link>

    <div :class="['label-container', `offset__${offset}`]">
      <!-- ----------------------------------------------------- Label Title -->
      <div class="verse-title">
        <span class="label">{{ verse.name }}</span>
        <ButtonIcon
          v-if="!isPublic"
          class="verse-settings-button"
          @clicked="emit('open-verse-settings', verse._id)">
          <IconEllipsis class="icon-ellipsis" />
        </ButtonIcon>
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
  to: {
    type: String,
    required: false,
    default: ''
  }
})

const emit = defineEmits(['open-verse-settings'])

// ======================================================================== Data
const offset = ref('middle')

// ==================================================================== Computed
const height = computed(() => offset.value === 'middle' ? 50 : 76)
const viewbox = computed(() => `0 0 4 ${height.value}`)
const isPublic = computed(() => props.verse.public)

// ===================================================================== Methods
const colorStyles = computed(() => {
  return {
    '--orb-primary-color': props.verse.average_colors.primary,
    '--orb-secondary-color': props.verse.average_colors.secondary
  }
})

const setOffsetPosition = () => {
  const offsets = ['left', 'middle', 'right']
  const index = Math.floor(Math.random() * 3)
  offset.value = offsets[index]
}

// ======================================================================= Hooks
onMounted(() => {
  setOffsetPosition()
})
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.verse-portal {
  --orb-primary-color: #6B7080;
  --orb-secondary-color: #E5FF00;
  position: absolute;
  left: 0;
  top: 50%;
  .label {
    filter: drop-shadow(0 0 torem(10) var(--orb-primary-color)) drop-shadow(0 0 torem(16) var(--orb-secondary-color));
  }
  .orb {
    &:before {
      background-color: var(--orb-primary-color);
      filter: drop-shadow(0 0 torem(16) var(--orb-secondary-color));
    }
  }
}

.orb {
  position: relative;
  width: torem(40);
  height: torem(40);
  border-radius: 50%;
  filter: blur(torem(10));
  transition: transform 200ms ease-in-out;
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
  }
  &:hover {
    transform: scale(1.5);
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
}

.label {
  font-size: torem(20);
  font-family: 'Nanum Myeongjo', sans-serif;
  font-weight: 700;
  white-space: nowrap;
}

.indicator {
  position: absolute;
  top: 100%;
  left: calc(50% - 2px);
  transform-origin: center top;
}

.verse-settings-button {
  position: absolute;
  padding: torem(6);
  bottom: 50%;
  left: 100%;
  width: torem(30);
  height: torem(30);
  :deep(.svg-border) {
    rect {
      x: 1.5;
      y: 1.5;
      width: torem(39);
      height: torem(39);
      stroke-width: 3;
      stroke: $gullGray;
    }
  }
  .icon-ellipsis {
    :deep(circle) {
      fill: $gullGray;
    }
  }
}
</style>
