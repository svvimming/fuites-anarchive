<template>
  <button :class="['caddy-button', { selected }, { disabled: forceDisabled }]">

    <Tooltip :tooltip="`caddy-${props.tool}`" :contact="contacts[tool]">

      <ZeroButton
        :class="['icon-button', { disabled: forceDisabled }]"
        @click="emit('clicked')">

        <SvgCaddyButtonConcaveShadow :class="['button-shadow', 'concave', { display: recessed }]" />

        <SvgCaddyButtonConvexShadow :class="['button-shadow', 'convex', { display: !recessed }]" />

        <div class="slot">
          <slot></slot>
        </div>

      </ZeroButton>

    </Tooltip>

  </button>
</template>

<script setup>
// ======================================================================= Setup
const props = defineProps({
  selected: {
    type: Boolean,
    required: false,
    default: false
  },
  tool: {
    type: String,
    required: true
  },
  forceDisabled: {
    type: Boolean,
    required: false,
    default: false
  },
  forcePressed: {
    type: Boolean,
    required: false,
    default: false
  }
})

const emit = defineEmits(['clicked'])

// ======================================================================== Data
const contacts = {
  'handle': 'bottom-right',
  'trash': 'top-left',
  'layer-opacity': 'bottom-left',
  'rotation': 'bottom-left',
  'font-editor': 'top-right',
  'color-selector': 'bottom-right',
  'resize': 'top-right',
  'volume': 'bottom-right',
  'clip-toggle': 'bottom-right',
  'lock': 'bottom-left',
  'link-editor': 'bottom-right'
}

// ==================================================================== Computed
const recessed = computed(() => props.forcePressed || props.selected)

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.caddy-button {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  &.selected {
    visibility: hidden;
    opacity: 0;
  }
  &:active {
    .button-shadow.concave {
      opacity: 1;
    }
    .button-shadow.convex {
      opacity: 0;
    }
  }
  &.disabled {
    pointer-events: none;
    &:hover {
      cursor: default;
    }
  }
}

:deep(.tooltip) {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  text-align: start;
  .floating {
    z-index: 100000;
  }
  &.contact__top-left {
    .floating {
      bottom: 75%;
      right: 75%;
    }
  }
  &.contact__bottom-left {
    .floating {
      top: 75%;
      right: 75%;
    }
  }
  &.contact__top-right {
    .floating {
      bottom: 75%;
      left: 75%;
    }
  }
  &.contact__bottom-right {
    .floating {
      top: 75%;
      left: 75%;
    }
  }
}

.button-shadow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 100ms ease;
  &.display {
    opacity: 1;
  }
}

.icon-button {
  width: 100%;
  height: 100%;
}

.slot {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
