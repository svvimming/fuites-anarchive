<template>
  <div
    id="text-editor"
    :class="{ active: id }"
    :style="{
      left: `${(rect.x + sceneData.x - 6) * sceneData.scale - rect.width * 0.5}px`,
      top: `${(rect.y + sceneData.y + 5) * sceneData.scale - rect.height * 0.5}px`,
      transform: `scale(${sceneData.scale}) rotate(${rotation}deg)`,
      '--text-color': color,
      '--text-font-size': `${fontsize}px`
    }">

    <div ref="sizer" class="input-sizer">
      <textarea
        v-model="content"
        :no-trim="true"
        :class="['textarea', family]"
        :style="{ width: rect.width + 'px', height: rect.height + 'px' }" />
    </div>

  </div>
</template>

<script setup>
// ====================================================================== Import
import { useResizeObserver } from '@vueuse/core'

// ======================================================================== Data
const verseStore = useVerseStore()
const { sceneData } = storeToRefs(verseStore)
const collectorStore = useCollectorStore()
const { thingies, editing } = storeToRefs(collectorStore)

const sizer = ref(null)
const id = ref('')
const content = ref('')
const rect = ref({ x: 0, y: 0, width: 100, height: 100 })

useResizeObserver(sizer, (entries) => {
  const entry = entries[0]
  const { width, height } = entry.contentRect
  Object.assign(rect.value, { width, height })
})

// ==================================================================== Computed
const active = computed(() => thingies.value.data.find(item => item._id === id.value))
const rotation = computed(() => active.value?.at.rotation)
const color = computed(() => active.value?.text.color || '#000000')
const fontsize = computed(() => active.value?.text.fontsize || 13)
const family = computed(() => active.value?.text.family || 'nanum')

// ==================================================================== Watchers
watch(editing, (newId, oldId) => {
  if (oldId && oldId === id.value) {
    handleSubmit({
      _id: id.value,
      at: Object.assign({}, rect.value, { rotation: rotation.value }),
      text: Object.assign({}, active.value.text, {
        content: content.value
      })
    })
  }
  const editingThingie = thingies.value.data.find(item => item._id === newId)
  if (editingThingie && editingThingie.thingie_type === 'text') {
    rect.value = { ...editingThingie.at }
    content.value = editingThingie.text.content
    id.value = editingThingie._id
  }
})

watch(content, (val) => {
  sizer.value.dataset.value = val
})

// ===================================================================== Methods
/**
 * @method handleSubmit
 */

const handleSubmit = update => {
  collectorStore.initThingieUpdate(update)
  id.value = ''
  content.value = ''
  rect.value = { x: 0, y: 0, width: 100, height: 100, rotation: 0 }
}

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
#text-editor {
  --text-color: #000000;
  --text-font-size: 13;
  position: absolute;
  display: flex;
  z-index: 1;
  opacity: 0;
  visibility: hidden;
  &.active {
    opacity: 1;
    visibility: visible;
    transition: opacity 10ms linear, visibility 10ms linear;
    transition-delay: 10ms;
  }
  .input-sizer {
    &:before {
      box-shadow: 0px 0px 3px 1px var(--text-color);
    }
  }
  .textarea {
    color: var(--text-color);
    font-size: var(--text-font-size);
  }
}

.input-sizer {
  position: relative;
  display: flex;
  border-radius: torem(4);
  transform: translate(0);
  transition: transform 200ms ease;
  &:before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    border-radius: torem(4);
    opacity: 0.5;
    z-index: -1;
  }
  .textarea {
    // width: auto;
    // min-width: 1em;
    // grid-area: 2 / 1;
    // resize: none;
    height: 100%;
    text-wrap: nowrap;
    resize: both;
    transition: none;
    background: none;
    appearance: none;
    border: none;
    padding: torem(4) torem(6);
    line-height: 1.5;
  }
  // &:after {
  //   content: attr(data-value) ' ';
  //   visibility: hidden;
  //   white-space: pre-wrap;
  // }
}
</style>
