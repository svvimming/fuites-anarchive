<template>
  <UseDraggable
    :initial-value="{ x: 140, y: 140 }"
    :prevent-default="true"
    :handle="handle"
    :container-element="container"
    :class="['caddy-wrapper', { active: thingie }]">

    <div id="caddy" :class="['caddy', { expanded }, `selected__${selected}`]">
      <!-- ========================================================== Handle -->
      <div
        ref="handle"
        class="caddy-tool-button handle"
        :style="getToolTransform('handle')"
        @click="handleToolClick('handle')">
        <IconHand />
      </div>
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
      </ButtonCaddy>
      <!-- =========================================================== Tools -->
      <!-- ------------------------------------------ Shared [Layer/Opacity] -->
      <CaddyLayerOpacity
        :class="['caddy-tool', 'z-index-2', { selected: selected === 'layer-opacity'}]"
        @bring-forward="bringThingieForward"
        @send-back="sendThingieBack" />
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
        v-if="type === 'text' && textEditor"
        :class="['caddy-tool', 'z-index-2', { selected: selected === 'font-editor' }]" />
      <!-- ------------------------------------- Text & Sound [Color Picker] -->
      <CaddyColorSelector
        v-if="type === 'text' || type === 'sound'"
        :init-color="thingieColor || '#000000'"
        :class="['caddy-tool', 'z-index-1', { selected: selected === 'color-selector'}]"
        @color-change="handleColorSelection" />
      <!-- -------------------------------------------------- Sound [Volume] -->

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
const expanded = computed(() => ['color-selector', 'font-editor', 'rotation', 'layer-opacity', 'resize', 'volume'].includes(selected.value))
const type = computed(() => thingie.value?.thingie_type)
const colors = computed(() => thingie.value.colors)
const thingieColor = computed(() => colors.value[colors.value.length - 1])
const tools = computed(() => type.value === 'image' ? imageTools : type.value === 'text' ? textTools : soundTools)

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
  }
})

// ===================================================================== Methods
/**
 * @method handleToolClick
 */

const handleToolClick = tool => {
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
 * @method changeOpacity
 */

const changeOpacity = amt => {
  if (thingie.value) {
    update({
      opacity: Math.max(0.1, Math.min(1, thingie.value.opacity + amt))
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
 * @method getToolTransform
 */

const getToolTransform = id => {
  if (id === selected.value) {
    return { '--tool-offset-x': '0px', '--tool-offset-y': '0px' }
  }
  const index = positions.value[id]
  const distance = selected.value === 'font-editor' ? 110 : expanded.value ? 90 : 60
  const coords = {
    x: Math.cos((index * 2 * Math.PI / (tools.value.length)) + 1) * distance,
    y: Math.sin((index * 2 * Math.PI / (tools.value.length)) + 1) * distance
  }
  return { '--tool-offset-x': coords.x + 'px', '--tool-offset-y': coords.y + 'px' }
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
    width: torem(90);
    height: torem(90);
    transform: translate(-50%, -50%);
    transition: 200ms ease;
    background-color: $stormGray;
    border-radius: 50%;
  }
  &.expanded {
    &:before {
      width: torem(142);
      height: torem(142);
    }
  }
  &.selected__font-editor {
    &:before {
      width: torem(182);
      height: torem(182);
    }
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
  :deep(path),
  :deep(circle) {
    stroke: $stormGray;
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
