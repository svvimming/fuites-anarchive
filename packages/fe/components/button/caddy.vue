<template>
  <button :class="['caddy-button', { selected }]" @click="emit('clicked')">

    <Tooltip :tooltip="`caddy-${props.tool}`" :contact="contacts[tool]">

      <slot></slot>

    </Tooltip>

  </button>
</template>

<script setup>
// ======================================================================= Props
const props = defineProps({
  selected: {
    type: Boolean,
    required: false,
    default: false
  },
  tool: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['clicked'])

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
</style>
