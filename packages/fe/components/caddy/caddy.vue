<template>
  <UseDraggable
    :initial-value="{ x: 140, y: 140 }"
    :prevent-default="true"
    :handle="handle"
    :container-element="container"
    :class="['caddy-wrapper', { active: thingie }]">

    <div id="caddy" :class="['caddy', { expanded }, `selected__${selected}`]">
      <!-- ==========================================================Handle -->
      <div
        ref="handle"
        class="caddy-tool handle"
        :style="getToolTransform('handle')"
        @click="setSelected('handle')">
        <IconHand />
      </div>
      <!-- ========================================================== Shared -->
      <div
        v-for="(tool, i) in shared"
        :key="`tool-${i + 1}`"
        :class="['caddy-tool', 'shared-tool', 'z-index-2', tool.name, tool.type, { pair: tool.params.length === 2 }]"
        :style="getToolTransform(tool.name)">
        <template v-for="param in tool.params" :key="param.directive">
          <ButtonRetrigger
            v-if="param.button === 'retrigger'"
            :class="['param-button', param.directive]"
            @retrigger="handleShared(param.directive, param.closeOnSelect)">
            <IconRotateArrow v-if="tool.name === 'rotation'" />
            <span v-else>{{ param.content }}</span>
          </ButtonRetrigger>
          <button
            v-else
            :class="['param-button', param.directive]"
            @click="handleShared(param.directive, param.closeOnSelect)">
            <IconArrowLarge v-if="param.directive === 'bringForward'" />
            <IconArrowSmall v-else-if="param.directive === 'sendBack'" />
            <IconOpaque v-else-if="param.directive === 'increaseOpacity'" />
            <IconTransparent v-else-if="param.directive === 'decreaseOpacity'" />
            <IconTrashbin v-else-if="param.directive === 'deleteThingie'" />
            <span v-else>{{ param.content }}</span>
          </button>
        </template>

      </div>
      <!-- ============================================================ Text -->
      <CaddyFontEditor
        v-if="type === 'text'"
        :selected="selected === 'font-editor'"
        class="caddy-tool z-index-2"
        :style="getToolTransform('font-editor')"
        @click.native="setSelected('font-editor')" />
      <!-- ====================================================== Text/Sound -->
      <CaddyColorSelector
        v-if="type === 'text' || type === 'sound'"
        :init-color="thingieColor || '#000000'"
        :selected="selected === 'color-selector'"
        class="caddy-tool z-index-1"
        :style="getToolTransform('color-selector')"
        @click.native="setSelected('color-selector')"
        @color-change="handleColorSelection" />
      <!-- =========================================================== Image -->
      <template v-if="type === 'image'">
        <div class="caddy-tool clip-toggle" :style="getToolTransform('clip-toggle')">
          <button
            class="param-button"
            @click="handleToggleClip">
            <IconScizors />
          </button>
        </div>
      </template>

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
const generalStore = useGeneralStore()
const { siteData } = storeToRefs(generalStore)
const collectorStore = useCollectorStore()
const { thingies, editing } = storeToRefs(collectorStore)
const pocketStore = usePocketStore()
const { pocket } = storeToRefs(pocketStore)
const verseStore = useVerseStore()
const { page, textEditor, colorSelectorHex } = storeToRefs(verseStore)
const alertStore = useZeroAlertStore()

const soundThingieData = ref({})
const handle = ref(null)
const selected = ref('handle')
const positions = ref({
  'handle': 0,
  'rotation': 1,
  'z-index': 2,
  'opacity': 3,
  'delete-thingie': 4,
  'color-selector': 5,
  'clip-toggle': 5,
  'font-editor': 6
})

// ==================================================================== Computed
const thingie = computed(() => thingies.value.data.find(item => item._id === editing.value))
const pageThingies = computed(() => thingies.value.data.filter(item => item.location === page.value?.data?.name))
const pocketThingies = computed(() => thingies.value.data.filter(item => item.location === 'pocket' && item.pocket_ref === pocket.value.data?._id))
const editableParams = computed(() => siteData.value?.settings?.thingieEditableParams || [])
const expanded = computed(() => ['color-selector', 'font-editor'].includes(selected.value))
const type = computed(() => thingie.value?.thingie_type)
const shared = computed(() => editableParams.value?.shared || [])
const colors = computed(() => thingie.value.colors)
const thingieColor = computed(() => colors.value[colors.value.length - 1])
const toolNum = computed(() => {
  const num = type.value === 'text' ? 2 : type.value === 'image' ? 1 : 1
  return num + shared.value.length + 1 // + 1 is for the handle
})

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
})

// ===================================================================== Methods
/**
 * @method handleShared
 */

const handleShared = (directive, closeOnSelect) => {
  switch (directive) {
    case 'rotateCW' : rotateThingie(1); break
    case 'rotateCCW' : rotateThingie(-1); break
    case 'bringForward' : bringThingieForward(); break
    case 'sendBack' : sendThingieBack(); break
    case 'increaseOpacity' : changeOpacity(0.1); break
    case 'decreaseOpacity' : changeOpacity(-0.1); break
    case 'deleteThingie' : openDeleteThingieModal(); break
  }
  if (closeOnSelect) {
    nextTick(() => { collectorStore.setEditing(false) })
  }
}

/**
 * @method setSelected
 */

const setSelected = id => {
  positions.value[selected.value] = positions.value[id]
  positions.value[id] = 0
  selected.value = id
}

/**
 * @method rotateThingie
 */

const rotateThingie = delta => {
  if (thingie.value) {
    update({
      at: Object.assign({}, thingie.value.at, { rotation: thingie.value.at.rotation + delta })
    })
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
 * @method handleToggleClip
 */

const handleToggleClip = () => {
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
    x: Math.cos((index * 2 * Math.PI / (toolNum.value - 1)) + 1) * distance,
    y: Math.sin((index * 2 * Math.PI / (toolNum.value - 1)) + 1) * distance
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
  background-color: $woodsmoke;
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
    background-color: $woodsmoke;
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
}

.caddy-tool {
  --tool-offset-x: 0px;
  --tool-offset-y: 0px;
  position: absolute;
  top: 50%;
  left: 50%;
  width: torem(52);
  height: torem(52);
  z-index: 1;
  background-color: $woodsmoke;
  border-radius: 50%;
  transition: 200ms ease;
  transform: translate(calc(-50% + var(--tool-offset-x)), calc(-50% + var(--tool-offset-y)));
  &.z-index-2 {
    z-index: 2;
  }
}

// /////////////////////////////////////////////////////////////////////// Tools
.shared-tool {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  border: solid 0.5px $woodsmoke;
  // background-color: white;
  overflow: hidden;
  width: torem(52);
  height: torem(52);
  &.fontfamily {
    width: unset;
    height: unset;
  }
  &.rotation,
  &.z-index {
    .param-button {
      padding: 0 torem(2);
    }
  }
  &.opacity {
    .param-button {
      :deep(svg) {
        width: torem(14);
        height: torem(14);
      }
    }
  }
  &.delete-thingie {
    .param-button {
      :deep(svg) {
        width: torem(22);
        height: torem(22);
      }
    }
  }
  &.pair {
    &:before {
      content: '';
      position: absolute;
      width: 0;
      height: 50%;
      border-right: solid torem(1) rgba(255, 255, 255, 0.5);
    }
    .param-button {
      justify-content: center;
      align-items: center;
      min-width: torem(19);
    }
  }
}

.param-button {
  display: flex;
  color: $woodsmoke;
  font-size: torem(8);
  &:active {
    transform: scale(1.15);
  }
  &.rotateCCW {
    :deep(svg) {
      transform: scaleX(-1);
    }
  }
  &.bringForward {
    :deep(svg) {
      transform: translateY(torem(-4));
    }
  }
  &.decreaseOpacity {
    margin-right: torem(4);
  }
}

.clip-toggle {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
