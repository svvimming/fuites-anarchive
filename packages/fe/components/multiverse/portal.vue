<template>
  <div class="verse-portal">
    <!-- --------------------------------------------------------------- Orb -->
    <div class="orb"></div>

    <div class="label-container" :style="labelStyles">
      <!-- ----------------------------------------------------- Label Title -->
      <div class="verse-title">
        <span class="label">{{ verse.name }}</span>
        <ButtonIcon
          class="verse-settings-button"
          @clicked="emit('open-verse-settings', verse._id)">
          <IconEllipsis class="icon-ellipsis" />
        </ButtonIcon>
      </div>
      <!-- ------------------------------------------------------- Indicator -->
      <svg
        width="4"
        height="81"
        viewBox="0 0 4 81"
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
  labelRadius: {
    type: Number,
    required: false,
    default: 0
  },
  labelAngle: {
    type: Number,
    required: false,
    default: 0
  },
  to: {
    type: String,
    required: false,
    default: ''
  }
})

const emit = defineEmits(['open-verse-settings']) 

// ==================================================================== Computed
const labelStyles = computed(() => ({
  left: `${(Math.cos(props.labelAngle * Math.PI / 180) * props.labelRadius) + 20}px`,
  top: `${Math.sin(props.labelAngle * Math.PI / 180) * props.labelRadius}px`
}))
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.verse-portal {
  position: absolute;
}

.orb {
  position: relative;
  width: torem(40);
  height: torem(40);
  border-radius: 50%;
  filter: blur(torem(10));
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background-color: #6B7080;
    filter: drop-shadow(0 0 torem(16) #E5FF00);
  }
}

.label-container {
  position: absolute;
  transform: translate(-50%, -50%);
}

.verse-title {
  position: relative;
}

.label {
  font-size: torem(20);
  font-family: 'Nanum Myeongjo', sans-serif;
  font-weight: 700;
  filter: drop-shadow(0 0 torem(10) #6B7080) drop-shadow(0 0 torem(16) #E5FF00);
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
