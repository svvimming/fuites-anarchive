<template>
  <UseDraggable
    :initial-value="{ x: 40, y: 40 }"
    :prevent-default="true"
    :handle="handle"
    :container-element="container"
    class="caddy-wrapper">
    <div id="caddy" :class="{ active: thingie }">

      <div ref="handle" class="handle">
        handle
      </div>
      
      <div
        v-for="(tool, i) in tools"
        :key="`tool-${i}`"
        :class="['tool', tool.name, tool.type]">
        <template v-for="param in tool.params" :key="param.directive">

          <ButtonRetrigger
            v-if="param.button === 'retrigger'"
            :class="['param-button', { pair: tool.params.length === 2 }]"
            @retrigger="handleClick(param.directive, param.closeOnSelect)">
            {{ param.content }}
          </ButtonRetrigger>

          <ButtonSelector
            v-else-if="param.button === 'selector'"
            :options="param.options"
            @selected="(selection) => { handleClick(param.directive, param.closeOnSelect, selection) }" />

          <button
            v-else
            :class="['param-button', { pair: tool.params.length === 2 }]"
            @click="handleClick(param.directive, param.closeOnSelect)">
            {{ param.content }}
          </button>

        </template>
      </div>


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
const { page, textEditor } = storeToRefs(verseStore)

const handle = ref(null)

// ==================================================================== Computed
const fonts = computed(() => siteData.value?.settings?.fonts || [])
const thingie = computed(() => thingies.value.data.find(item => item._id === editing.value))
const pageThingies = computed(() => thingies.value.data.filter(item => item.location === page.value?.data?.name))
const pocketThingies = computed(() => thingies.value.data.filter(item => item.location === 'pocket' && item.pocket_ref === pocket.value.data._id))
const editableParams = computed(() => siteData.value?.settings?.thingieEditableParams || [])
const exclusive = computed(() => editableParams.value[thingie.value?.thingie_type] || [])
const shared = computed(() => editableParams.value?.shared || [])
const tools = computed(() => shared.value.concat(exclusive.value))

// ===================================================================== Methods
/**
 * @method handleClick
 */

const handleClick = (directive, closeOnSelect, val) => {
  switch (directive) {
    case 'rotateCW' : rotateThingie(1); break
    case 'rotateCCW' : rotateThingie(-1); break
    case 'bringForward' : bringThingieForward(); break
    case 'sendBack' : sendThingieBack(); break
    case 'increaseFontSize' : changeFontSize(1); break
    case 'decreaseFontSize' : changeFontSize(-1); break
    case 'toggleSelectionBold' : textEditor.value.chain().focus().toggleBold().run(); break
    case 'toggleSelectionItalic' : textEditor.value.chain().focus().toggleItalic().run(); break
    case 'toggleSelectionUnderline' : textEditor.value.chain().focus().toggleUnderline().run(); break
    case 'toggleSelectionStrike' : textEditor.value.chain().focus().toggleStrike().run(); break
    case 'setSelectionFontFamily' : setSelectionFontFamily(val) ; break
  }
  if (closeOnSelect) {
    nextTick(() => { collectorStore.setEditing(false) })
  }
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
 * @method changeFontSize
 */

const changeFontSize = amt => {
  update({
    text: Object.assign({}, thingie.value.text, {
      fontsize: thingie.value.text.fontsize + amt
    })
  })
}

/**
 * @method setSelectionFontFamily
 */

const setSelectionFontFamily = family => {
  const font = fonts.value.find(item => item.class === family)
  textEditor.value.chain().focus().setFontFamily(font.fontFaceDeclaration).run()
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
}

#caddy {
  padding: 1rem;
  background-color: red;
  color: white;
  opacity: 0;
  visibility: hidden;
  transform: scale(0.8);
  transition: 200ms ease;
  &.active {
    opacity: 1;
    visibility: visible;
    transform: scale(1);
  }
}

.handle {
  &:hover {
    cursor: grab;
  }
  &:active {
    cursor: grabbing;
  }
}

// /////////////////////////////////////////////////////////////////////// Tools
.tool {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-radius: 50%;
  border: solid 0.5px black;
  background-color: white;
  overflow: hidden;
  width: torem(40);
  height: torem(40);
  &.fontfamily {
    width: unset;
    height: unset;
  }
}

.param-button {
  color: black;
  font-size: torem(8);
  &.pair {
    width: 50%;
    height: 100%;
    &:first-child {
      border-right: solid 0.5px black;
    }
  }
}
</style>
