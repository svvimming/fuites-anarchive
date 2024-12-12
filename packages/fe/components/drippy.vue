<template>
  <div
    id="drippy"
    ref="drippy"
    :class="['drippy', `side__${sideX}`, `side__${sideY}`]"
    :style="{ left: `${x}px`, top: `${y}px` }">
    <span
      v-html="tip"
      class="tip">
    </span>
  </div>
</template>

<script setup>
// ====================================================================== Import
import { useMouse, useElementByPoint, useElementBounding } from '@vueuse/core'

// ======================================================================== Data
const { x, y } = useMouse({ type: 'client' })
const { element } = useElementByPoint({ x, y })
const drippy = ref(null)
const tip = ref('')
const sideX = ref('right')
const sideY = ref('bottom')
const { width, height } = useElementBounding(drippy)

// ==================================================================== Watchers
watch(element, (el) => {
  if (el && el.dataset.tooltip) {
    tip.value = el.dataset.tooltip
  } else if (tip.value !== '') {
    tip.value = ''
  }
})

watch([tip, x, y], () => {
  if (window && tip.value) { setTipSides() }
})

// ===================================================================== Methods
const setTipSides = () => {
  const horizontal = x.value + width.value > window.innerWidth ? 'left' : 'right'
  const vertical = y.value + 24 + height.value > window.innerHeight ? 'top' : 'bottom'
  if (sideX.value !== horizontal) {
    sideX.value = horizontal
  }
  if (sideY.value !== vertical) {
    sideY.value = vertical
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.drippy {
  position: absolute;
  z-index: 10000000;
  width: torem(160);
  &.side__top {
    &.side__left {
      transform: translate(-100%, calc(-100%  - torem(24)));
    }
    &.side__right {
      transform: translate(0, calc(-100%  - torem(24)));
    }
  }
  &.side__bottom {
    &.side__left {
      transform: translate(-100%, torem(24));
    }
    &.side__right {
      transform: translate(0, torem(24));
    }
  }
}

.tip {
  display: block;
  line-height: 1.4;
  font-size: torem(12);
}
</style>
