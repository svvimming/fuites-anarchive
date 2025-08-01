<template>
  <div :class="['resize-tool', type]" :style="{ '--parent-radius': `${parentRadius}px` }">
    <!-- ==================================================== BUTTONS BEFORE -->
    <div class="buttons-before">

      <ButtonRetrigger
        v-if="type === 'image'"
        @retrigger="handleResize(0.025)">
        <IconScaleUp />
      </ButtonRetrigger>

      <template v-else>
        <ButtonRetrigger @retrigger="handleResize(0.025)">
          <IconScaleUpHalfsize />
        </ButtonRetrigger>
        <ButtonRetrigger @retrigger="handleResize(-0.025)">
          <IconScaleDownHalfsize />
        </ButtonRetrigger>
      </template>

    </div>
  <!-- ==================================================== BUTTONS AFTER -->
    <div class="buttons-after">

      <ButtonRetrigger
        v-if="type === 'image'"
        @retrigger="handleResize(-0.025)">
        <IconScaleDown />
      </ButtonRetrigger>

      <template v-else>
        <ButtonRetrigger @retrigger="handleStrokeWidthResize(0.25)">
          <IconStrokeWidthUp />
        </ButtonRetrigger>
        <ButtonRetrigger @retrigger="handleStrokeWidthResize(-0.25)">
          <IconStrokeWidthDown />
        </ButtonRetrigger>
      </template>

    </div>
    <!-- ========================================================= TOOL ICON -->
    <ButtonCaddy
      :force-disabled="true"
      :force-pressed="true"
      tool="resize"
      class="resize-icon">
      <IconScale class="icon" />
    </ButtonCaddy>

  </div>
</template>

<script setup>
// ======================================================================= Props
const props = defineProps({
  type: {
    type: String,
    required: false,
    default: 'image'
  },
  parentRadius: {
    type: Number,
    required: false,
    default: 66
  },
  variantMobile: {
    type: Boolean,
    required: false,
    default: false
  }
})

const emit = defineEmits(['resize-thingie', 'update-stroke-width'])

// ======================================================================== Data
const collectorStore = useCollectorStore()
const { thingies, editing } = storeToRefs(collectorStore)
const resizeSliderRef = ref(null)
const strokeSliderRef = ref(null)

// ==================================================================== Computed
const thingie = computed(() => thingies.value.data.find(item => item._id === editing.value))
const dimensions = computed(() => thingie.value?.at)
const strokeWidth = computed(() => thingie.value?.stroke_width)

// ==================================================================== Watchers
watch(editing, () => {
  if (resizeSliderRef.value) {
    resizeSliderRef.value.setTheta(0)
  }
  if (strokeSliderRef.value) {
    strokeSliderRef.value.setTheta(0)
  }
})

// ===================================================================== Methods
const handleResize = delta => {
  if (dimensions.value) {
    const width = dimensions.value.width
    const height = dimensions.value.height
    const scale = 1 + delta
    emit('resize-thingie', {
      width: width * scale,
      height: height * scale
    })
  }
}

const handleStrokeWidthResize = delta => {
  if (strokeWidth.value) {
    const scale = 1 + delta
    emit('update-stroke-width', strokeWidth.value * scale)
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.resize-tool {
  --parent-radius: 66px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: calc(2 * var(--parent-radius));
  height: calc(2 * var(--parent-radius));
  touch-action: none;
  &.image {
    flex-direction: column;
    .buttons-before {
      margin-bottom: torem(21);
    }
    .buttons-after {
      margin-top: torem(21);
    }
    :deep(.retrigger-button) {
      svg {
        width: calc(var(--parent-radius) * 1.318);
        height: calc(var(--parent-radius) * 0.575);
      }
    }
  }
  &.sound {
    flex-direction: row;
    .buttons-before {
      margin-right: torem(7);
    }
    .buttons-after {
      margin-left: torem(7);
    }
    .buttons-before,
    .buttons-after {
      :last-child {
        margin-top: torem(2);
      }
    }
    :deep(.retrigger-button) {
      svg {
        width: calc(var(--parent-radius) * 0.77);
        height: calc(var(--parent-radius) * 0.8);
      }
    }
  }
}

.resize-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  width: torem(52);
  height: torem(52);
  transform: translate(-50%, -50%);
  .icon {
    width: torem(20);
    height: torem(20);
    :deep(rect),
    :deep(path) {
      stroke: white;
    }
  }
}

.stroke-width-slider {
  position: absolute;
}

.buttons-before,
.buttons-after {
  display: flex;
  justify-content: center;
  flex-direction: column;
}

:deep(.retrigger-button) {
  display: flex;
}
</style>
