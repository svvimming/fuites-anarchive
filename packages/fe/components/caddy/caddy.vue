<template>
  <UseDraggable
    :initial-value="{ x: 40, y: 40 }"
    :prevent-default="true"
    :handle="handle"
    :container-element="container"
    :class="['caddy-wrapper', { active: thingie }]">

    <div id="caddy" class="caddy">
      <!-- ---------------------------------------------------------- Handle -->
      <div ref="handle" class="handle">
        handle
      </div>
      
      <!-- ========================================================== Shared -->
      <div
        v-for="(tool, i) in shared"
        :key="`tool-${i}`"
        :class="['tool', tool.name, tool.type]">
        <template v-for="param in tool.params" :key="param.directive">
          <ButtonRetrigger
            v-if="param.button === 'retrigger'"
            :class="['param-button', { pair: tool.params.length === 2 }, param.directive]"
            @retrigger="handleShared(param.directive, param.closeOnSelect)">
            {{ param.content }}
          </ButtonRetrigger>
          <button
            v-else
            :class="['param-button', { pair: tool.params.length === 2 }, param.directive]"
            @click="handleShared(param.directive, param.closeOnSelect)">
            {{ param.content }}
          </button>
        </template>
      </div>

      <!-- ============================================================ Text -->
      <template v-if="type === 'text'">

        <CaddyFontFamilySelector
          :expanded="expanded === 'font-family-selector'"
          @click.native="setExpanded('font-family-selector')" />

        <CaddyFontSizeSelector
          :expanded="expanded === 'font-size-selector'"
          @click.native="setExpanded('font-size-selector')" />

        <CaddyFontStyleSelector />

        <CaddyColorSelector
          :init-color="thingieColor || '#000000'"
          :expanded="expanded === 'color-selector'"
          @click.native="setExpanded('color-selector')"
          @color-change="handleColorSelection" />
        
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
const { page, textEditor } = storeToRefs(verseStore)

const handle = ref(null)
const expanded = ref('')

// ==================================================================== Computed
const thingie = computed(() => thingies.value.data.find(item => item._id === editing.value))
const pageThingies = computed(() => thingies.value.data.filter(item => item.location === page.value?.data?.name))
const pocketThingies = computed(() => thingies.value.data.filter(item => item.location === 'pocket' && item.pocket_ref === pocket.value.data._id))
const editableParams = computed(() => siteData.value?.settings?.thingieEditableParams || [])
const type = computed(() => thingie.value?.thingie_type)
const shared = computed(() => editableParams.value?.shared || [])
const colors = computed(() => thingie.value.colors)
const thingieColor = computed(() => colors.value[colors.value.length - 1])

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
  }
  if (closeOnSelect) {
    nextTick(() => { collectorStore.setEditing(false) })
  }
}

/**
 * @method setExpanded
 */

const setExpanded = val => {
  if (expanded.value !== val) {
    expanded.value = val
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
 * @method handleColorSelection
 */

const handleColorSelection = val => {
  if (type.value === 'text') {
    textEditor.value.chain().focus().setColor(val).run()
  }
  verseStore.setColorSelectorHex(val)
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
  padding: 1rem;
  background-color: red;
  color: white;
  transition: 200ms ease;
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
  border: solid 0.5px $woodsmoke;
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
  color: $woodsmoke;
  font-size: torem(8);
  &.pair {
    width: 50%;
    height: 100%;
    &:first-child {
      border-right: solid 0.5px $woodsmoke;
    }
  }
}
</style>
