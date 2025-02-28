<template>
  <div :class="['tooltip', `contact__${contact}`, { disabled }]">

    <div class="floating">
      <div class="tip">

        <span v-if="tooltips[tooltip]?.heading" class="heading">
          {{ tooltips[tooltip].heading }}
        </span>

        <span
          v-if="tooltips[tooltip]?.message"
          class="message"
          v-html="tooltips[tooltip].message">
        </span>

        <slot name="message" />

      </div>
    </div>

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
  }
})
// ======================================================================== Data
const generalStore = useGeneralStore()
const { siteData, activeModes } = storeToRefs(generalStore)

// ==================================================================== Computed
const tooltips = computed(() => siteData.value?.settings?.tooltips || {})
const disabled = computed(() => !activeModes.value.drippy || props.forceDisabled)

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
