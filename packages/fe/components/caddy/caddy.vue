<template>
  <UseDraggable
    :initial-value="{ x: 140, y: 140 }"
    :prevent-default="true"
    :handle="handle"
    :container-element="container"
    :on-move="handleOnMove"
    :on-end="handleDragEnd"
    :class="['caddy-wrapper', { active: thingie }]">

    <div id="caddy" :class="['caddy', `selected__${selected}`]" :style="caddyStyles">
      <!-- ========================================================== Handle -->
      <div
        ref="handle"
        class="caddy-tool-button handle"
        :style="getToolTransform('handle')">
        <ButtonIcon
          :class="['solid-outline', { outside: selected !== 'handle' }]"
          @clicked="handleToolClick('handle')">
          <IconHand />
        </ButtonIcon>
      </div>
      <!-- ======================================================== Trashbin -->
      <ButtonCaddy
        class="caddy-tool-button z-index-2 trash-button"
        :style="getToolTransform('trash')"
        @clicked="openDeleteThingieModal">
        <IconTrashbin />
      </ButtonCaddy>
      <!-- ==================================================== Tool Buttons -->
      <ButtonCaddy
        v-for="tool in tools"
        :key="`${tool}-button`"
        :selected="selected === tool"
        class="caddy-tool-button z-index-2"
        :style="getToolTransform(tool)"
        @clicked="handleToolClick(tool)">
        <IconFonts v-if="tool === 'font-editor'" />
        <IconColorPicker v-if="tool === 'color-selector'" />
        <IconRotation v-if="tool === 'rotation'" />
        <IconLayerOpacity v-if="tool === 'layer-opacity'" />
        <IconScizors v-if="tool === 'clip-toggle'" />
        <IconScale v-if="tool === 'resize'" />
        <IconVolume v-if="tool === 'volume'" />
      </ButtonCaddy>
      <!-- =========================================================== Tools -->
      <!-- ------------------------------------------ Shared [Layer/Opacity] -->
      <CaddyLayerOpacity
        :class="['caddy-tool', 'z-index-2', { selected: selected === 'layer-opacity'}]"
        @bring-forward="bringThingieForward"
        @send-back="sendThingieBack"
        @update-opacity="updateOpacity" />
      <!-- ----------------------------------------------- Shared [Rotation] -->
      <CaddyRotation
        :default-angle="initAngle"
        :class="['caddy-tool', 'z-index-2', { selected: selected === 'rotation' }]"
        @update-rotation="rotateThingie" />
      <!-- ------------------------------------------ Image & Sound [Resize] -->
      <CaddyResize
        v-if="type === 'image' || type === 'sound'"
        :class="['caddy-tool', 'z-index-2', { selected: selected === 'resize' }]"
        @resize-thingie="resizeThingie"
        @update-stroke-width="updateStrokeWidth" />
      <!-- ---------------------------------------------- Text [Font Editor] -->
      <CaddyFontEditor
        v-if="textEditor"
        :class="['caddy-tool', 'z-index-2', { selected: selected === 'font-editor' }]" />
      <!-- ------------------------------------- Text & Sound [Color Picker] -->
      <CaddyColorSelector
        v-if="type === 'text' || type === 'sound'"
        :init-color="thingieColor || '#000000'"
        :class="['caddy-tool', 'z-index-1', { selected: selected === 'color-selector'}]"
        @color-change="handleColorSelection" />
      <!-- -------------------------------------------------- Sound [Volume] -->
      <CaddyVolume
        v-if="type === 'sound'"
        :class="['caddy-tool', 'z-index-1', { selected: selected === 'volume' }]" />

    </div>

  </UseDraggable>
</template>

<script setup>
// ====================================================================== Import
import { useThrottleFn } from '@vueuse/core'
import { UseDraggable } from '@vueuse/components'

// ======================================================================= Setup
defineProps({
  container: {
    type: [Object, null],
    required: true
  }
})

// ======================================================================== Data
const collectorStore = useCollectorStore()
const { thingies, editing } = storeToRefs(collectorStore)
const pocketStore = usePocketStore()
const { pocket } = storeToRefs(pocketStore)
const verseStore = useVerseStore()
const { page, textEditor, colorSelectorHex } = storeToRefs(verseStore)
const alertStore = useZeroAlertStore()

const soundThingieData = ref({})
const initAngle = ref(0)
const dragging = ref(false)
const handle = ref(null)
const selected = ref('handle')
const imageTools = [
  'layer-opacity',
  'rotation',
  'resize',
  'clip-toggle'
]
const textTools = [
  'layer-opacity',
  'rotation',
  'font-editor',
  'color-selector'
]
const soundTools = [
  'layer-opacity',
  'rotation',
  'resize',
  'color-selector',
  'volume'
]
const radii = {
  'handle': 60,
  'layer-opacity': 86,
  'rotation': 86,
  'resize': 86,
  'clip-toggle': 60,
  'font-editor': 86,
  'color-selector': 86,
  'volume': 86
}
const positions = ref({
  'handle': 0,
  'layer-opacity': 1,
  'rotation': 2,
  'resize': 3,
  'clip-toggle': 4,
  'font-editor': 3,
  'color-selector': 4,
  'volume': 5
})

// ==================================================================== Computed
const thingie = computed(() => thingies.value.data.find(item => item._id === editing.value))
const pageThingies = computed(() => thingies.value.data.filter(item => item.location === page.value?.data?.name))
const pocketThingies = computed(() => thingies.value.data.filter(item => item.location === 'pocket' && item.pocket_ref === pocket.value.data?._id))
const type = computed(() => thingie.value?.thingie_type)
const colors = computed(() => thingie.value.colors)
const thingieColor = computed(() => colors.value[colors.value.length - 1])
const tools = computed(() => type.value === 'image' ? imageTools : type.value === 'text' ? textTools : soundTools)
const caddyStyles = computed(() => ({ '--center-panel-diameter': `${2 * (radii[selected.value] || 45) - 30}px` }))

// ==================================================================== Watchers
watch(() => thingie.value?._id, (newId, oldId) => {
  // Update closed sound thingie with saved hex color
  if (oldId && soundThingieData.value._id === oldId && colorSelectorHex.value.sound) {
    collectorStore.initThingieUpdate({
      _id: oldId,
      colors: soundThingieData.value.colors.concat(colorSelectorHex.value.sound)
    })
  }
  // reset sound thingie data
  if (soundThingieData.value._id) { soundThingieData.value = {} }
  // Reset selector hex for new sound thingie being edited
  if (newId && thingie.value.thingie_type === 'sound') {
    verseStore.setColorSelectorHex({ sound: '' })
    soundThingieData.value = {
      _id: newId,
      colors: [...thingie.value.colors]
    }
  }
  if (newId) {
    initAngle.value = thingie.value.at.rotation
    handleToolClick('handle')
    resetPositions()
  }
})

// ===================================================================== Methods
/**
 * @method handleToolClick
 */

const handleToolClick = tool => {
  if (tool === 'handle' && dragging.value) { return }
  if (tool === 'clip-toggle') {
    toggleImageClip()
  } else {
    positions.value[selected.value] = positions.value[tool]
    positions.value[tool] = 0
    selected.value = tool
  }
}

/**
 * @method rotateThingie
 */

const rotateThingie = deg => {
  if (thingie.value) {
    update({
      at: Object.assign({}, thingie.value.at, { rotation: deg })
    })
  }
}

/**
 * @method resizeThingie
 */

const resizeThingie = dimensions => {
  if (thingie.value) {
    update({
      at: Object.assign({}, thingie.value.at, dimensions)
    })
  }
}

/**
 * @method updateStrokeWidth
 */

const updateStrokeWidth = val => {
  if (thingie.value) {
    update({ stroke_width: val })
  }
}

/**
 * @method bringThingieForward
 */

const bringThingieForward = () => {
  if (thingie.value) {
    const location = thingie.value.location
    let max
    if (location === 'pocket') {
      max = Math.max(...pocketThingies.value.map(item => item.zIndex))
    } else {
      max = Math.max(...pageThingies.value.map(item => item.zIndex))
    }
    update({ zIndex: max + 1 })
  }
}

/**
 * @method sendThingieBack
 */

const sendThingieBack = () => {
  if (thingie.value) {
    const location = thingie.value.location
    let min
    if (location === 'pocket') {
      min = Math.min(...pocketThingies.value.map(item => item.zIndex))
    } else {
      min = Math.min(...pageThingies.value.map(item => item.zIndex))
    }
    update({ zIndex: min - 1 })
  }
}

/**
 * @method handleColorSelection
 */

const handleColorSelection = val => {
  if (type.value === 'text') {
    textEditor.value.chain().focus().setColor(val).run()
  }
  verseStore.setColorSelectorHex({ [type.value]: val })
}

/**
 * @method updateOpacity
 */

const updateOpacity = val => {
  if (thingie.value) {
    update({
      opacity: Math.max(0.1, Math.min(1, val))
    })
  }
}

/**
 * @method toggleImageClip
 */

const toggleImageClip = () => {
  if (thingie.value) {
    update({ clip: !thingie.value.clip })
  }
}

/**
 * @method openDeleteThingieModal
 */

const openDeleteThingieModal = () => {
  alertStore.openAlert('delete-thingie-alert')
}

/**
 * @method resetPositions
 */

const resetPositions = () => {
  positions.value = {
    'handle': 0,
    'layer-opacity': 1,
    'rotation': 2,
    'resize': 3,
    'clip-toggle': 4,
    'font-editor': 3,
    'color-selector': 4,
    'volume': 5
  }
}

/**
 * @method getToolTransform
 */

const getToolTransform = id => {
  if (id === selected.value) {
    return { '--tool-offset-x': '0px', '--tool-offset-y': '0px' }
  }
  const index = id === 'trash' ? 2.5 : positions.value[id]
  const distance = (radii[selected.value] || 60) - (id === 'trash' ? 10 : 0)
  const phase = tools.value.length === 5 ? (Math.PI / 3.3333) : 0
  const coords = {
    x: Math.cos((index * 2 * Math.PI / (tools.value.length)) + phase) * distance,
    y: Math.sin((index * 2 * Math.PI / (tools.value.length)) + phase) * distance
  }
  return { '--tool-offset-x': coords.x + 'px', '--tool-offset-y': coords.y + 'px' }
}

/**
 * @method handleOnMove
 */

 const handleOnMove = () => {
  if (!dragging.value) { dragging.value = true }
}

/**
 * @method handleDragEnd
 */

const handleDragEnd = () => {
  setTimeout(() => { dragging.value = false }, 50)
}

/**
 * @method update
 */

const update = useThrottleFn(data => {
  collectorStore.initThingieUpdate(Object.assign(data, { _id: thingie.value._id }))
}, 5)
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.caddy-wrapper {
  position: absolute;
  z-index: 1;
  visibility: hidden;
  .caddy {
    opacity: 0;
    transform: scale(0.8);
  }
  &.active {
    visibility: visible;
    .caddy {
      opacity: 1;
      transform: scale(1);
    }
  }
}

#caddy {
  --center-panel-diameter: torem(90);
  position: relative;
  padding: torem(19);
  background-color: $stormGray;
  color: white;
  transition: 200ms ease;
  border-radius: 50%;
  @include modalShadow;
  &:before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--center-panel-diameter);
    height: var(--center-panel-diameter);
    transform: translate(-50%, -50%);
    transition: 200ms ease;
    background-color: $stormGray;
    border-radius: 50%;
  }
}

.handle {
  display: flex;
  background-color: transparent !important;
  z-index: 100000 !important;
  &:hover {
    cursor: grab;
  }
  &:active {
    cursor: grabbing;
  }
  :deep(.icon-button) {
    width: 100% !important;
    height: 100% !important;
    --two-tone-a: #{$stormGray};
    --two-tone-b: white;
    &.outside {
      .svg-border {
        rect {
          stroke-dasharray: none;
        }
      }
    }
  }
}

.caddy-tool-button {
  --tool-offset-x: 0px;
  --tool-offset-y: 0px;
  position: absolute;
  top: 50%;
  left: 50%;
  width: torem(52);
  height: torem(52);
  z-index: 1;
  background-color: $stormGray;
  border-radius: 50%;
  transition: 200ms ease;
  transform: translate(calc(-50% + var(--tool-offset-x)), calc(-50% + var(--tool-offset-y)));
  &.z-index-2 {
    z-index: 2;
  }
}

.trash-button {
  width: torem(32) !important;
  height: torem(32) !important;
  background-color: white !important;
  border-radius: 50%;
  border: solid torem(3) $stormGray;
  z-index: 4 !important;
}

.caddy-tool {
  position: absolute;
  left: 50%;
  top: 50%;
  // width: // 100%; height and width are set inside the tool component
  // height: // 100%; height and width are set inside the tool component
  transform: translate(-50%, -50%);
  transition: 200ms ease;
  visibility: hidden;
  opacity: 0;
  &.selected {
    visibility: visible;
    opacity: 1;
  }
}
</style>
