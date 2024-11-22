<template>
  <div
    id="text-editor"
    :class="{ active: id }"
    :style="{
      left: `${(rect.x + sceneData.x - 6) * sceneData.scale - rect.width * 0.5}px`,
      top: `${(rect.y + sceneData.y + 6) * sceneData.scale - rect.height * 0.5}px`,
      transform: `scale(${sceneData.scale}) rotate(${rotation}deg)`,
      '--text-color': color,
      '--text-font-size': `${fontsize}px`
    }">

    <div ref="sizer" class="input-sizer">
      <div  
        class="editor-wrapper"
        :style="{ width: rect.width + 'px', height: rect.height + 'px' }"
        @click="textEditor?.view.focus()">

        <EditorContent
          v-if="textEditor"
          :editor="textEditor"
          class="content-editor"
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
  EditorContent,
  Extension
} from '@tiptap/vue-3'

// ======================================================================== Data
const verseStore = useVerseStore()
const { sceneData, textEditor } = storeToRefs(verseStore)
const collectorStore = useCollectorStore()
const { thingies, editing } = storeToRefs(collectorStore)

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
const color = computed(() => active.value?.text.color || '#000000')
const fontsize = computed(() => active.value?.text.fontsize || 13)
// const family = computed(() => active.value?.text.family || 'nanum')

// ==================================================================== Watchers
watch(editing, (newId, oldId) => {
  if (oldId && oldId === id.value) {
    handleSubmit({
      _id: id.value,
      at: Object.assign({}, rect.value, { rotation: rotation.value }),
      text: Object.assign({}, active.value.text, {
        content: textEditor.value.getHTML().replaceAll('<p></p>', '<p><br></p>')
      })
    })
  }
  const editingThingie = thingies.value.data.find(item => item._id === newId)
  if (editingThingie && editingThingie.thingie_type === 'text') {
    rect.value = { ...editingThingie.at }
    id.value = editingThingie._id
    const content = editingThingie.text.content.replaceAll('<p><br></p>', '<p></p>')
    textEditor.value.commands.setContent(content, false, { preserveWhitespace: 'full' })
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

const handleSubmit = update => {
  collectorStore.initThingieUpdate(update)
  id.value = ''
  rect.value = { x: 0, y: 0, width: 100, height: 100, rotation: 0 }
  textEditor.value.commands.setContent('', false, { preserveWhitespace: 'full' })
}

// ======================================================================= Hooks
onMounted(async () => {
  // initialize Tiptap Editor
 verseStore.setTextEditor(new Editor({
    content: '',
    editable: true,
    extensions: [
      StarterKit.configure({ codeBlock: false })
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
}

// :deep(.ProseMirror-trailingBreak) {
//   display: none;
// }
</style>
