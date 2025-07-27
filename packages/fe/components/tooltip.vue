<template>
  <div
    :class="[
      'tooltip',
      `contact__${contact}`,
      { disabled },
      { 'force-active': drippyScene === drippy },
      `drippy-scene-${drippy}`
    ]">
    <!-- =========================================================== TOOLTIP -->
    <div class="floating">
      <div class="tip">
        <!-- ------------------------------------------------------- Heading -->
        <span v-if="display?.heading" class="heading">
          {{ display.heading }}
        </span>
        <!-- ------------------------------------------------------- Message -->
        <span
          v-if="display?.message"
          class="message"
          v-html="display.message">
        </span>
        <!-- ------------------------------------------------ Custom Message -->
        <slot name="message" />
        <!-- -------------------------------------------------------- Drippy -->
        <template v-if="drippyScene === drippy">
          <IconDrippy class="icon-drippy" />
          <ButtonBasic
            class="next-drippy-scene-button"
            @clicked="pocketStore.setDrippyScene(drippy + 1)">
            {{ drippy === 5 ? 'Done' : 'Next' }}
          </ButtonBasic>
        </template>

      </div>
    </div>
    <!-- ========================================================= COMPONENT -->
    <slot />

  </div>
</template>

<script setup>
// ======================================================================= Setup
const props = defineProps({
  contact: {
    type: String,
    required: false,
    default: 'bottom-left',
    validator (prop) {
      const allowList = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
      return allowList.includes(prop)
    }
  },
  tooltip: {
    type: String,
    required: true
  },
  forceDisabled: {
    type: Boolean,
    required: false,
    default: false
  },
  drippyScene: {
    type: [Number, Boolean],
    required: false,
    default: false
  }
})
// ======================================================================== Data
const generalStore = useGeneralStore()
const { siteData, activeModes, small } = storeToRefs(generalStore)
const pocketStore = usePocketStore()
const { drippy } = storeToRefs(pocketStore)

// ==================================================================== Computed
const disabled = computed(() => !activeModes.value.tooltips || props.forceDisabled)
const tooltips = computed(() => siteData.value?.settings?.tooltips || {})
const tooltipsMobile = computed(() => siteData.value?.settings?.tooltipsMobile || {})
const display = computed(() => {
  if (small.value) {
    return tooltipsMobile.value[props.tooltip] || tooltips.value[props.tooltip]
  }
  return tooltips.value[props.tooltip]
})

</script>

<style lang="scss" scoped>
$offset: 0.5rem;
$offsetOnHover: 0rem;

// ///////////////////////////////////////////////////////////////////// General
.tooltip {
  position: relative;
  &:not(.disabled) {
    &:hover {
      .floating {
        transition: 150ms ease-in;
        opacity: 1;
      }
    }
  }
  &.force-active {
    .floating {
      transition: 150ms ease-in;
      opacity: 1;
      transform: none !important;
      pointer-events: all !important;
    }
  }
  &.contact__top-left,
  &.contact__bottom-left {
    .floating {
      left: unset;
      right: 100%;
    }
  }
  &.contact__top-left {
    .tip {
      border-top-left-radius: torem(20);
      border-top-right-radius: torem(20);
      border-bottom-left-radius: torem(20);
    }
    .floating {
      bottom: 100%;
      transform: translate(0, calc(-1 * #{$offset}));
    }
    &:hover {
      .floating {
        transform: translate(0, calc(-1 * #{$offsetOnHover}));
      }
    }
  }
  &.contact__bottom-left {
    .tip {
      border-top-left-radius: torem(20);
      border-bottom-left-radius: torem(20);
      border-bottom-right-radius: torem(20);
    }
    .floating {
      top: 100%;
      transform: translate(0, $offset);
    }
    &:hover {
      .floating {
        transform: translate(0, $offsetOnHover);
      }
    }
  }
  &.contact__top-right,
  &.contact__bottom-right {
    .floating {
      left: 100%;
      right: unset;
    }
  }
  &.contact__top-right {
    .tip {
      border-top-left-radius: torem(20);
      border-top-right-radius: torem(20);
      border-bottom-right-radius: torem(20);
    }
    .floating {
      bottom: 100%;
      transform: translate(0, calc(-1 * #{$offset}));
    }
    &:hover {
      .floating {
        transform: translate(0, calc(-1 * #{$offsetOnHover}));
      }
    }
  }
  &.contact__bottom-right {
    .tip {
      border-top-right-radius: torem(20);
      border-bottom-left-radius: torem(20);
      border-bottom-right-radius: torem(20);
    }
    .floating {
      top: 100%;
      transform: translate(0, $offset);
    }
    &:hover {
      .floating {
        transform: translate(0, $offsetOnHover);
      }
    }
  }
  &.drippy-scene-3,
  &.drippy-scene-4 {
    .icon-drippy {
      right: unset;
      left: 100%;
      transform: translate(-30%, -30%);
    }
  }
}

.floating {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  transition: 150ms ease-out;
}

.tip {
  padding: torem(16);
  min-width: torem(244);
  background-color: $athensGray;
  box-shadow: torem(1) torem(3) torem(5) rgba(0, 0, 0, 0.15);
  :deep(span) {
    display: block;
    font-size: torem(14);
    line-height: normal;
    &.heading {
      font-weight: 600;
      margin-bottom: torem(6);
    }
    &.message {
      font-weight: 500;
      font-size: torem(14);
    }
  }
}

.icon-drippy {
  position: absolute;
  top: 100%;
  right: 100%;
  transform: translate(30%, -30%);
  filter: drop-shadow(0px 0px 25px #B2B9CC) drop-shadow(1px 2px 4px rgba(#262222, 0.25));
}

.next-drippy-scene-button {
  margin-top: torem(10);
}

.drippy-scene-2 {
  .icon-drippy {
    @include small {
      top: unset;
      right: unset;
      bottom: 100%;
      left: 100%;
      transform: translate(-50%, 50%) scale(0.9);
    }
  }
}

.drippy-scene-3 {
  .icon-drippy {
    @include small {
      top: unset;
      right: unset;
      bottom: 100%;
      left: 100%;
      transform: translate(-50%, 50%) scale(0.9) !important;
    }
  }
}

.drippy-scene-4 {
  .icon-drippy {
    @include small {
      transform: translate(-50%, -50%) scale(0.9) !important;
    }
  }
}

.drippy-scene-5 {
  .icon-drippy {
    @include small {
      top: 100%;
      right: unset;
      bottom: unset;
      left: 100%;
      transform: translate(-50%, -50%) scale(0.9) !important;
    }
  }
}
</style>
