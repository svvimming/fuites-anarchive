// /////////////////////////////////////////////////////////////////// Functions
// -----------------------------------------------------------------------------
const commands = () => {
  return [
    // ========================================================== type selection
    {
      label: 'Regular text',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('paragraph').run()
      }
    },
    {
      label: 'Heading 1',
      classes: 'type-h1',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
      }
    },
    {
      label: 'Heading 2',
      classes: 'type-h2',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
      }
    },
    {
      label: 'Heading 3',
      classes: 'type-h3',
      endOfGroup: true,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
      }
    },
    // ===================================================== general text markup
    // {
    //   label: 'Bold',
    //   icon: 'IconTypeBold',
    //   command: ({ editor, range }) => {
    //     editor.chain().focus().deleteRange(range).setMark('bold').run()
    //   }
    // },
    // {
    //   label: 'Italic',
    //   icon: 'IconTypeItalic',
    //   command: ({ editor, range }) => {
    //     editor.chain().focus().deleteRange(range).setMark('italic').run()
    //   }
    // },
    // {
    //   label: 'Underline',
    //   icon: 'IconTypeUnderline',
    //   command: ({ editor, range }) => {
    //     editor.chain().focus().deleteRange(range).setMark('italic').run()
    //   }
    // },
    // {
    //   label: 'Strikethrough',
    //   icon: 'IconTypeStrikethrough',
    //   endOfGroup: true,
    //   command: ({ editor, range }) => {
    //     editor.chain().focus().deleteRange(range).setMark('italic').run()
    //   }
    // },
    // =================================================================== other
    {
      label: 'Blockquote',
      icon: 'IconBlockquoteLeft',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run()
      }
    },
    {
      label: 'Codeblock',
      icon: 'IconCodeSlash',
      endOfGroup: true,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('codeBlock').run()
      }
    },
    // =================================================================== lists
    {
      label: 'Bulleted List',
      icon: 'IconListUl',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run()
      }
    },
    {
      label: 'Numbered list',
      icon: 'IconListOl',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run()
      }
    },
    {
      label: 'Checklist',
      icon: 'IconListCheck',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run()
      }
    }
  ]
}

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export default {
  items: commands,

  render: () => {
    let component
    let popup

    return {
      // ============================================================== onUpdate
      onUpdate (props) {
        component.updateProps(props)
        if (!props.clientRect) { return }
        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        })
      },

      // ============================================================= onKeyDown
      onKeyDown (props) {
        if (props.event.key === 'Escape') {
          popup[0].hide()
          return true
        }
        return component.ref?.onKeyDown(props)
      },

      // ================================================================ onExit
      onExit () {
        popup[0].destroy()
        component.destroy()
      }
    }
  }
}
