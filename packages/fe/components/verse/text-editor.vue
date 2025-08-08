<template>
  <div
    id="text-editor"
    :class="{ active: id, 'force-hide': forceHide }"
    :style="textEditorStyles">
    <div ref="sizer" class="input-sizer">
      <div
        class="editor-wrapper"
        :style="innerStyles"
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

// ======================================================================= Setup
const props = defineProps({
  forceHide: {
    type: Boolean,
    default: false
  }
})

// ======================================================================== Data
const collectorStore = useCollectorStore()
const { thingies, editing, deleted } = storeToRefs(collectorStore)
const verseStore = useVerseStore()
const {
  sceneData,
  textEditor,
  colorSelectorHex
} = storeToRefs(verseStore)
const generalStore = useGeneralStore()
const { small } = storeToRefs(generalStore)

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
const textEditorStyles = computed(() => {
  if (small.value) {
    return {
      left: '0',
      top: 'unset',
      bottom: '184px', // height of mobile caddy toolbar + height of mobile font editor
      transform: `scale(1) rotate(0deg)`,
      '--highlight-color': highlight.value
    }
  }
  return {
      left: `${(rect.value.x + sceneData.value.x - 6) * sceneData.value.scale - rect.value.width * 0.5}px`,
      top: `${(rect.value.y + sceneData.value.y - 6) * sceneData.value.scale - rect.value.height * 0.5}px`,
      transform: `scale(${sceneData.value.scale}) rotate(${rotation.value}deg)`,
      '--highlight-color': highlight.value
    }
})
const innerStyles = computed(() => {
  if (small.value) {
    return { width: '100%', height: '100%', opacity: '1' }
  }
  return { width: rect.value.width + 'px', height: rect.value.height + 'px', opacity: opacity.value }
})

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
    const oldThingie = thingies.value.data.find(item => item._id === oldId)
    const at = small.value ?
                    Object.assign({}, oldThingie.at, { width: rect.value.width, height: rect.value.height }) :
                    Object.assign({}, rect.value, { rotation: rotation.value })
    handleSubmit({
      _id: id.value,
      at,
      text: text.replaceAll('<p></p>', '<p><br></p>'),
      ...(pushColor && {
        colors: colors.value.concat([colorSelectorHex.value.text])
      })
    })
  }
  const editingThingie = thingies.value.data.find(item => item._id === newId)
  if (editingThingie && editingThingie.thingie_type === 'text') {
    rect.value = small.value ? { x: 0, y: 0, width: window.innerWidth, height: 100, rotation: 0 } : { ...editingThingie.at }
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
  touch-action: none;
  &.active {
    opacity: 1;
    visibility: visible;
    transition: opacity 10ms linear, visibility 10ms linear;
    transition-delay: 10ms;
  }
  @include small {
    width: 100%;
    background-color: white;
  }
  .input-sizer {
    &:before {
      box-shadow: 0px 0px 3px 1px var(--highlight-color);
    }
  }
  &.force-hide {
    opacity: 0;
    visibility: hidden;
  }
}

.input-sizer {
  position: relative;
  display: flex;
  border-radius: torem(4);
  @include small {
    width: 100%;
  }
  &:before,
  &:after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    border-radius: torem(4);
    opacity: 0.5;
    z-index: -1;
    @include small {
      height: calc(100% + torem(86));
    }
  }
  &:after {
    display: none;
    background-color: white;
    @include small {
      display: block;
      opacity: 1;
    }
  }
}

.editor-wrapper {
  display: flex;
  flex-direction: column;
  position: relative;
  cursor: text;
  overflow-y: scroll;
  resize: both;
  @include small {
    resize: none;
  }
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
