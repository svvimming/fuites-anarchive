<template>
  <div
    ref="container"
    class="markdown-editor"
    @click="editor?.view.focus()">

    <EditorContent
      v-if="editor"
      ref="editorRef"
      :editor="editor"
      placeholder="Write something..."
      class="content-editor markdown"
      @keydown="handleEditorKeydown" />

  </div>
</template>

<script setup>
// ===================================================================== Imports
import { StarterKit } from '@tiptap/starter-kit'
import {
  Editor,
  EditorContent,
  Extension
} from '@tiptap/vue-3'
import Suggestion from '@tiptap/suggestion'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import Table from '@tiptap/extension-table'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkSectionize from 'remark-sectionize'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { visit } from 'unist-util-visit'

import rehypeParse from 'rehype-parse'
import rehypeRemark from 'rehype-remark'
import remarkStringify from 'remark-stringify'

import suggestion from './suggestion.js'
import { useResizeObserver } from '@vueuse/core'

// ======================================================================= Setup
const props = defineProps({
  input: {
    type: String,
    default: '',
    required: false
  }
})

const emit = defineEmits(['content-changed', 'dimensions-changed'])

// ======================================================================== Data
const container = ref(null)
const editor = ref(false)
const editorRef = ref(null)
const markdownToHtml = ref(null)
const htmlToMarkdown = ref(null)

useResizeObserver(container, (entries) => {
  const entry = entries[0]
  const { width, height } = entry.contentRect
  emit('dimensions-changed', { width, height })
})

// ================================================ Markdown <-> HTML Processors
// --------------------------------------------------------------------- Plugins
const reformatListItems = () => {
  return (tree) => {
    visit(
      tree,
      'listItem',
      listItem => {
        if (listItem.children.length > 1) {
          const children = [...listItem.children]
          listItem.children = children.reduce((childAcc, child, index, arr) => {
            const hasCheckboxRegex = /^\[[ x]\]$/i
            const nextChild = arr[index + 1]
            const grandchild = child.children[0].value
            if (
              child.type === 'paragraph' &&
              grandchild.match(hasCheckboxRegex) !== null
            ) {
              const isCheckedRegex = /^\[[x]\]$/i
              listItem.checked = grandchild.match(isCheckedRegex) !== null ? true : false
              childAcc.push(nextChild)
            }
            if (child.type !== 'paragraph') {
              childAcc.push(child)
            }
            return childAcc
          }, [])
        }
        return listItem
    })
    return tree
  }
}


// ------------------------------------------------------------------ Processors
markdownToHtml.value = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkSectionize)
  .use(remarkRehype)
  .use(rehypeStringify)

htmlToMarkdown.value = unified()
  .use(rehypeParse, { fragment: true })
  .use(rehypeRemark)
  .use(remarkGfm)
  .use(reformatListItems)
  .use(remarkStringify, {
    bullet: '-',
    fences: false
  })

// ===================================================================== Methods
/**
 * @method createCommandPaletteExtension
 */

const createCommandPaletteExtension = () => {
  return Extension.create({
    name: 'command-palette',
    addOptions () {
      return {
        suggestion: {
          char: '/',
          command: ({ editor, range, props }) => {
            props.command({ editor, range })
          }
        }
      }
    },
    addProseMirrorPlugins () {
      return [
        Suggestion({
          editor: this.editor,
          ...this.options.suggestion
        })
      ]
    }
  })
}

/**
 * @method parseMarkdown
 */

const parseMarkdown = () => {
  return new Promise(resolve => {
    markdownToHtml.value.process(props.input, (err, file) => {
      if (err) { console.log('error during parsing ', err) }
      if (file.hasOwnProperty('value')) { resolve(file.value) }
    })
  })
}

/**
 * @method handleEditorKeydown
 */

const handleEditorKeydown = e => {
  e.stopPropagation()
}

/**
 * @method getMarkdown
 */

const getMarkdown = async () => {
  return await htmlToMarkdown.value.process(editor.value.getHTML())
}

defineExpose({ getMarkdown })

// ======================================================================= Hooks
onMounted(async () => {
  // initialize Tiptap Editor
  // const CommandPaletteExt = await createCommandPaletteExtension()
  const content = await parseMarkdown()
  editor.value = new Editor({
    content,
    editable: true,
    extensions: [
      StarterKit.configure({ codeBlock: false })
    ],
    onUpdate: async ({ editor }) => {
      const markdown = await htmlToMarkdown.value.process(editor.getHTML())
      emit('content-changed', markdown.value)
    }
  })    
  // focus the editor
  nextTick(() => {
    if (editor.value) { editor.value.chain().focus().run() }
  })
})

onBeforeUnmount(() => {
  if (editor.value) { editor.value.destroy() }
})
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.markdown-editor {
  display: flex;
  flex-direction: column;
  position: relative;
  cursor: text;
  overflow-y: scroll;
  resize: both;
  background-color: white;
  border: solid 0.5px black;
}
</style>
