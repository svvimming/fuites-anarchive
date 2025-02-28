<template>
  <div
    id="drippy"
    ref="drippy"
    :class="['drippy', `side__${sideX}`, `side__${sideY}`]"
    :style="{ left: `${x}px`, top: `${y}px` }">
    <div v-if="tip" class="tip">

      <span v-if="tip.heading" class="heading">
        {{ tip.heading }}
      </span>

      <span
        class="message"
        v-html="tip.message">
      </span>

    </div>
  </div>
</template>

<script setup>
// ====================================================================== Import
import { useMouse, useElementBounding } from '@vueuse/core'

// ======================================================================== Data
const { x, y } = useMouse({ type: 'client' })
const drippy = ref(null)
const sideX = ref('right')
const sideY = ref('bottom')
const { width, height } = useElementBounding(drippy)
const generalStore = useGeneralStore()
const { siteData, mouseOverScene } = storeToRefs(generalStore)

// ==================================================================== Computed
const tooltips = computed(() => siteData.value?.settings?.tooltips || {})
const tip = computed(() => tooltips.value[mouseOverScene.value])

// ==================================================================== Watchers
watch(tip, () => { setTipSides() })

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
      .tip {
        border-top-left-radius: torem(20);
        border-top-right-radius: torem(20);
        border-bottom-left-radius: torem(20);
      }
    }
    &.side__right {
      transform: translate(0, calc(-100%  - torem(24)));
      .tip {
        border-top-right-radius: torem(20);
        border-top-left-radius: torem(20);
        border-bottom-right-radius: torem(20);
      }
    }
  }
  &.side__bottom {
    &.side__left {
      transform: translate(-100%, torem(24));
      .tip {
        border-top-left-radius: torem(20);
        border-bottom-right-radius: torem(20);
        border-bottom-left-radius: torem(20);
      }
    }
    &.side__right {
      transform: translate(torem(8), torem(24));
      .tip {
        border-top-right-radius: torem(20);
        border-bottom-right-radius: torem(20);
        border-bottom-left-radius: torem(20);
      }
    }
  }
}

.tip {
  padding: torem(16);
  min-width: torem(244);
  background-color: $athensGray;
  box-shadow: torem(1) torem(3) torem(5) rgba(0, 0, 0, 0.15);
  :deep(span) {
    display: block;
    font-size: torem(12);
    line-height: normal;
    &.heading {
      font-weight: 600;
      margin-bottom: torem(6);
    }
    &.message {
      font-weight: 500;
    }
  }
}
</style>
