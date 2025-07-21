<template>
  <div :class="['caddy-mobile', { active: thingie }]">
    <!-- ======================================================= Trash Alert -->
    <CaddyMobileTrashAlert v-show="selected === 'trash'" class="mobile-trash-alert" />
    <!-- ============================================================= Tools -->
    <div :class="['tool-container', { 'hide-tool': hideTool }]" :style="toolCtnStyles">
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
        :type="type"
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
        v-show="type === 'sound'"
        :active="selected === 'volume'"
        :class="['caddy-tool', 'z-index-1', { selected: selected === 'volume' }]"
        @update-gain="handleGainUpdate" />
      <!-- =================================================== Connector SVG -->
      <SvgCaddyMobileConnector v-if="!hideTool" class="caddy-tool-connector" />
    </div>
    <!-- ============================================================ Slider -->
    <div class="slider-container">
      <div
        :class="['tool-slider', { 'clip-active': thingie?.clip }, { 'locked': thingie?.locked }]"
        :style="{ transform: `translateX(${sliderX}px)` }">
        <div
          v-for="tool in tools"
          :key="tool"
          class="tool-slide">
          <ButtonCaddy
            :tool="tool"
            :selected="selected === tool"
            :class="['mobile-tool-button', { neutral: selected !== tool }, tool]"
            @clicked="handleToolClick(tool)">
            <IconTrashbin v-if="tool === 'trash'" class="icon" />
            <IconFonts v-if="tool === 'font-editor'" class="icon" />
            <IconColorPicker v-if="tool === 'color-selector'" class="icon" />
            <IconRotation v-if="tool === 'rotation'" class="icon" />
            <IconLayerOpacity v-if="tool === 'layer-opacity'" class="icon" />
            <IconScizors v-if="tool === 'clip-toggle'" class="icon" />
            <IconScale v-if="tool === 'resize'" class="icon" />
            <IconVolume v-if="tool === 'volume'" class="icon" />
            <IconLock v-if="tool === 'lock'" class="icon" />
          </ButtonCaddy>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script setup>
// ====================================================================== Import
import { useThrottleFn } from '@vueuse/core'

// ======================================================================== Data
const collectorStore = useCollectorStore()
const { thingies, editing } = storeToRefs(collectorStore)
const pocketStore = usePocketStore()
const { pocket } = storeToRefs(pocketStore)
const verseStore = useVerseStore()
const { page, textEditor, colorSelectorHex } = storeToRefs(verseStore)

const soundThingieData = ref({})
const initAngle = ref(0)
const selected = ref('rotation')
const imageTools = [
  'trash',
  'layer-opacity',
  'rotation',
  'resize',
  'clip-toggle',
  'lock'
]
const textTools = [
  'trash',
  'layer-opacity',
  'rotation',
  'font-editor',
  'color-selector',
  'lock'
]
const soundTools = [
  'trash',
  'layer-opacity',
  'rotation',
  'resize',
  'color-selector',
  'volume',
  'lock'
]
const radii = {
  'trash': 86,
  'layer-opacity': 86,
  'rotation': 86,
  'resize': 86,
  'clip-toggle': 86,
  'font-editor': 90,
  'color-selector': 90,
  'volume': 86,
  'lock': 86
}

// ==================================================================== Computed
const thingie = computed(() => thingies.value.data.find(item => item._id === editing.value))
const pageThingies = computed(() => thingies.value.data.filter(item => item.location === page.value?.data?.name))
const pocketThingies = computed(() => thingies.value.data.filter(item => item.location === 'pocket' && item.pocket_ref === pocket.value.data?._id))
const type = computed(() => thingie.value?.thingie_type)
const colors = computed(() => thingie.value.colors)
const thingieColor = computed(() => colors.value[colors.value.length - 1])
const tools = computed(() => type.value === 'image' ? imageTools : type.value === 'text' ? textTools : soundTools)
const sliderX = computed(() => tools.value.indexOf(selected.value) * -72) // 48px slide width + 12px margin + 12px margin
const toolCtnStyles = computed(() => ({ '--center-panel-diameter': `${2 * (radii[selected.value] || 45) - 40}px` }))
const hideTool = computed(() => ['clip-toggle', 'trash', 'lock'].includes(selected.value))

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
    // If the new thingie type doesn't have the selected tool, reset to rotation
    if (!tools.value.includes(selected.value)) {
      selected.value = 'rotation'
    }
  }
})

// watch(selected.value, () => {
//   if () {

//   }
// })

// ==================================================================== Methods
/**
 * @method handleToolClick
 */

const handleToolClick = (tool) => {
  if (tool === 'clip-toggle' && selected.value === 'clip-toggle') {
    toggleImageClip()
  }
  if (tool === 'lock' && selected.value === 'lock') {
    toggleLock()
  }
  selected.value = tool
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
 * @method rotateThingie
 */

const rotateThingie = deg => {
  if (thingie.value) {
    update({ at: { ...thingie.value.at, rotation: deg } })
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
 * @method handleColorSelection
 */

const handleColorSelection = val => {
  if (type.value === 'text') {
    textEditor.value.chain().focus().setColor(val).run()
  }
  verseStore.setColorSelectorHex({ [type.value]: val })
}

/**
 * @method handleGainUpdate
 */

const handleGainUpdate = val => {
  if (thingie.value) {
    update({ gain: val })
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
 * @method toggleLock
 */

const toggleLock = () => {
  if (thingie.value) {
    update({ locked: !thingie.value.locked })
  }
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
.caddy-mobile {
  display: none;
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: torem(98);
  z-index: 10;
  visibility: hidden;
  opacity: 0;
  &.active {
    display: block;
    visibility: visible;
    opacity: 1;
  }
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: $stormGray;
    z-index: 2;
  }
}

.mobile-trash-alert {
  position: absolute;
  top: torem(-16);
  left: 50%;
  transform: translate(-50%, -100%);
  // min-width: torem(340);
  z-index: 3;
}

.tool-container {
  --center-panel-diameter: torem(90);
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translate(-50%, torem(-76));
  background-color: $stormGray;
  color: white;
  transition: 200ms ease;
  border-radius: 50%;
  z-index: 1;
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
  &.hide-tool {
    visibility: hidden;
    opacity: 0;
  }
  .caddy-tool-connector {
    top: calc(var(--center-panel-diameter) * 0.5);
  }
}

.slider-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  &:before,
  &:after {
    content: '';
    position: absolute;
    top: 0;
    width: 22.5%;
    height: 100%;
    z-index: 10;
  }
  &:before {
    left: 0;
    background: linear-gradient(270deg, rgba(107, 112, 128, 0) 0%, $stormGray 90.83%);
  }
  &:after {
    right: 0;
    background: linear-gradient(90deg, rgba(107, 112, 128, 0) 0%, $stormGray 90.83%);
  }
}

.tool-slider {
  position: absolute;
  left: calc(50% - torem(36)); // half of container width minus half of one slide width + 12px margin
  top: calc(50% - torem(24)); // half of container height minus half of one slide height
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease-in-out;
  // z-index: 2;
  .mobile-tool-button.clip-toggle,
  .mobile-tool-button.lock {
    &:not(.neutral) {
      :deep(.button-shadow) {
        &.convex {
          opacity: 1 !important;
        }
        &.concave {
          opacity: 0 !important;
        }
      }
    } 
  } 
  &.clip-active,
  &.locked {
    .mobile-tool-button.clip-toggle,
    .mobile-tool-button.lock {
      &:not(.neutral) {
        :deep(.button-shadow) {
          &.convex {
            opacity: 0 !important;
          }
          &.concave {
            opacity: 1 !important;
          }
        }
      }
    }
  }
}

.tool-slide {
  display: flex;
  align-items: center;
  justify-content: center;
  width: torem(48);
  height: torem(48);
  margin: 0 torem(12);
  color: white;
}

.mobile-tool-button {
  position: relative !important;
  &.neutral {
    :deep(.button-shadow) {
      opacity: 0 !important;
    }
  }
  &.selected {
    visibility: visible !important;
    opacity: 1 !important;
  }
}

.caddy-tool {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  transition: 200ms ease;
  visibility: hidden;
  opacity: 0;
  &.selected {
    visibility: visible;
    opacity: 1;
  }
}

.caddy-tool-connector {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, torem(-3)) scale(0.85);
  transition: 200ms ease;
}

:deep(.font-family-selector) {
  .panel-container {
    top: unset !important;
    bottom: 100% !important;
    transform: translate(-50%, torem(-4)) !important;
    &:not(.open) {
      transform: translate(-50%, torem(-20)) !important;
    }
  }
}
</style>
