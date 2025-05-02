<template>
  <div
    id="text-editor"
    :class="{ active: id }"
    :style="{
      left: `${(rect.x + sceneData.x - 6) * sceneData.scale - rect.width * 0.5}px`,
      top: `${(rect.y + sceneData.y - 6) * sceneData.scale - rect.height * 0.5}px`,
      transform: `scale(${sceneData.scale}) rotate(${rotation}deg)`,
      '--highlight-color': highlight
    }">
    <div ref="sizer" class="input-sizer">
      <div
        class="editor-wrapper"
        :style="{ width: rect.width + 'px', height: rect.height + 'px', opacity }"
        @click="textEditor?.view.focus()">

        <EditorContent
          v-if="textEditor"
          :editor="textEditor"
          class="content-editor thingie-rich-text"
          @keydown="handleEditorKeydown" />

      </div>
    </div>
  </div>
</template>

<script setup>
// ====================================================================== Import
import { useResizeObserver } from '@vueuse/core'
import { StarterKit } from '@tiptap/starter-kit'
import {
  Editor,
  EditorContent
} from '@tiptap/vue-3'
import Underline from '@tiptap/extension-underline'
// import Strike from '@tiptap/extension-strike'
import TextStyle from '@tiptap/extension-text-style'
import FontFamily from '@tiptap/extension-font-family'
import FontSize from 'tiptap-extension-font-size'
import { Color } from '@tiptap/extension-color'

// ======================================================================== Data
const collectorStore = useCollectorStore()
const { thingies, editing, deleted } = storeToRefs(collectorStore)
const verseStore = useVerseStore()
const {
  sceneData,
  textEditor,
  colorSelectorHex
} = storeToRefs(verseStore)

const sizer = ref(null)
const id = ref('')
const rect = ref({ x: 0, y: 0, width: 100, height: 100 })

useResizeObserver(sizer, (entries) => {
  const entry = entries[0]
  const { width, height } = entry.contentRect
  Object.assign(rect.value, { width, height })
})

// ==================================================================== Computed
const active = computed(() => thingies.value.data.find(item => item._id === id.value))
const rotation = computed(() => active.value?.at.rotation)
const opacity = computed(() => active.value?.opacity || 1)
const colors = computed(() => active.value?.colors || [])
const highlight = computed(() => colors.value[colors.value.length - 1] || '#6c6575')

// ==================================================================== Watchers
watch(editing, (newId, oldId) => {
  if (oldId && oldId === id.value) {
    const pushColor = !!colorSelectorHex.value.text && colors.value[colors.value.length - 1] !== colorSelectorHex.value.text
    const text = textEditor.value.getHTML()
    // If the new text thingie is empty OR if this thingie has been deleted, return and reset
    if (text === '<p></p>' || deleted.value.includes(oldId)) {
      resetEditor()
      return
    }
    handleSubmit({
      _id: id.value,
      at: Object.assign({}, rect.value, { rotation: rotation.value }),
      text: text.replaceAll('<p></p>', '<p><br></p>'),
      ...(pushColor && {
        colors: colors.value.concat([colorSelectorHex.value.text])
      })
    })
  }
  const editingThingie = thingies.value.data.find(item => item._id === newId)
  if (editingThingie && editingThingie.thingie_type === 'text') {
    rect.value = { ...editingThingie.at }
    id.value = editingThingie._id
    const content = editingThingie.text.replaceAll('<p><br></p>', '<p></p>')
    textEditor.value.commands.setContent(content, false, { preserveWhitespace: 'full' })
    setTimeout(() => {
      textEditor.value.commands.focus()
    }, 100)
  }
})

// ===================================================================== Methods
/**
 * @method handleEditorKeydown
 */

const handleEditorKeydown = e => {
  e.stopPropagation()
}

/**
 * @method handleSubmit
 */

const handleSubmit = async update => {
  if (update._id === 'new-text-thingie') {
    await initCreateTextThingie(update)
  } else {
    collectorStore.initThingieUpdate(update)
  }
  resetEditor()
}

/**
 * @method initCreateTextThingie
 */

const initCreateTextThingie = async update => {
  const newTextThingie = thingies.value.data.find(item => item._id === 'new-text-thingie')
  const data = Object.assign({}, newTextThingie, update)
  delete data._id
  if (!thingies.value.refresh && newTextThingie) {
    // Create the new text thingie
    await collectorStore.postCreateThingie(data)
  }
}

/**
 * @method resetEditor
 */

const resetEditor = () => {
  verseStore.setColorSelectorHex({ text: '' })
  id.value = ''
  rect.value = { x: 0, y: 0, width: 100, height: 100, rotation: 0 }
  textEditor.value.commands.setContent('', false, { preserveWhitespace: 'full' })
  // Remove the template from the thingies array
  if (thingies.value.data.find(item => item._id === 'new-text-thingie')) {
    collectorStore.removeNewTextThingie()
  }
}

// ======================================================================= Hooks
onMounted(async () => {
  // initialize Tiptap Editor
 verseStore.setTextEditor(new Editor({
    content: '',
    editable: true,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      // Strike,
      TextStyle,
      FontFamily,
      FontSize,
      Color
    ],
    parseOptions: {
      preserveWhitespace: 'full'
    }
  }))
  // focus the editor
  nextTick(() => {
    if (textEditor.value) { textEditor.value.chain().focus().run() }
  })
})

onBeforeUnmount(() => {
  if (textEditor.value) { textEditor.value.destroy() }
})
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
#text-editor {
  --highlight-color: #000000;
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
      box-shadow: 0px 0px 3px 1px var(--highlight-color);
    }
  }
}

.input-sizer {
  position: relative;
  display: flex;
  border-radius: torem(4);
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
}

.editor-wrapper {
  display: flex;
  flex-direction: column;
  position: relative;
  cursor: text;
  overflow-y: scroll;
  resize: both;
}

:deep(.tiptap) {
  padding: torem(4) torem(6);
  line-height: 1.5;
  ::-moz-selection { background: rgba($woodsmoke, 0.05); }
  ::selection { background: rgba($woodsmoke, 0.05); }
  // p, div, li {
  //   line-height: 1;
  // }
}

// :deep(.ProseMirror-trailingBreak) {
//   display: none;
// }
</style>
