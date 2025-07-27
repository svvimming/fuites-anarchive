<template>
  <div
    :class="[
      'tooltip',
      `contact__${contact}`,
      { disabled },
      { 'force-active': drippyScene === drippy || forceActive },
      `drippy-scene-${drippy}`,
      tooltip,
      { [`variant__${variant}`]: variant }
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
      const allowList = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'left-center', 'right-center']
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
  forceActive: {
    type: Boolean,
    required: false,
    default: false
  },
  drippyScene: {
    type: [Number, Boolean],
    required: false,
    default: false
  },
  variant: {
    type: String,
    required: false,
    default: ''
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
      pointer-events: all !important;
    }
    &:not(.variant__mobile-pocket) {
      .floating {
        transform: none !important;
      }
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
  .message {
    @include small {
      min-width: torem(240);
    }
  }
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
  .message {
    @include small {
      min-width: torem(240);
    }
  }
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

// ////////////////////////////////////////////////////////////////////// Mobile
.contact__top-center,
.contact__bottom-center {
  .floating {
    left: 50%;
    z-index: 1000;
  }
  .tip {
    border-radius: torem(12);
    min-width: unset;
  }
  :deep(.heading) {
    white-space: nowrap;
    margin-bottom: 0 !important;
  }
  :deep(.message) {
    margin-top: torem(6);
  }
  :deep(.heading),
  :deep(.message) {
    text-align: center;
  }
}

.contact__top-center {
  .floating {
    top: unset;
    bottom: calc(100% + #{$offset});
  }
}

.contact__bottom-center {
  .floating {
    bottom: unset;
    top: calc(100% + #{$offset});
  }
}

.contact__left-center,
.contact__right-center {
  .floating {
    top: 50%;
    z-index: 1000;
    .tip {
      position: relative;
    }
  }
}

.contact__left-center {
  .floating {
    left: unset;
    right: 100%;
    transform: translate(torem(-12), -50%);
  }
  .tip {
    &:after {
      content: '▸';
      position: absolute;
      top: 50%;
      left: 100%;
      transform: translate(torem(3), -50%);
      font-size: torem(12);
      font-weight: 600;
      color: white;
      opacity: 0.8;
    }
  }
}

.contact__right-center {
  .floating {
    left: 100%;
    right: unset;
    transform: translate(torem(12), -50%);
  }
  .tip {
    &:after {
      content: '◂';
      position: absolute;
      top: 50%;
      right: 100%;
      transform: translate(torem(-3), -50%);
      font-size: torem(12);
      font-weight: 600;
      color: white;
      opacity: 0.8;
    }
  }
}

.tooltip-mode-toggle,
.portals-mode-toggle,
.external-links-mode-toggle,
.mobile-edit-mode-toggle {
  @include small {
    &:not(.disabled) {
      &:hover {
        .floating {
          transition: none;
          opacity: 0;
          transform: translate(-50%, 0);
          animation: tooltip-mobile-enter-exit 2s ease-in;
        }
      }
    }
  }
}

.variant__mobile-pocket {
  .floating {
    display: flex;
  }
  .tip {
    background-color: transparent;
    box-shadow: none;
    min-width: unset;
    padding: 0;
    :deep(.heading) {
      color: white;
      font-size: torem(12);
      font-weight: 600;
      color: white;
      white-space: nowrap;
      font-style: italic;
      margin-bottom: 0 !important;
      opacity: 0.8;
    }
    :deep(.message) {
      display: none;
    }
  }
  &.contact__bottom-left {
    .floating {
      transform: none !important;
    }
  }
  &.contact__bottom-right {
    .floating {
      // transform: translate(torem(12), 0) !important;
    }
  }
}
// ////////////////////////////////////////////////////////////////// Animations
@keyframes tooltip-mobile-enter-exit {
  0% {
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
</style>
