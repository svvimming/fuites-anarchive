<template>
  <div
    :key="`prop-board-instance-${key}`"
    :class="['prop-board', { open }, { touchmode }]"
    :style="editorStyles">

    <TextThingie
      :text="''"
      :fontsize="13"
      :editor="true"
      :propboard="true"
      :colorpicker="false"
      @change-font-size="changeFontSize"
      @change-font-family="changeFontFamily"
      @change-color="changeColor" />

    <form action="" class="text-form">

      <div
        ref="textArea"
        class="text-area-wrapper">
        <textarea
          v-model="text"
          :class="['text-input', fontfamily]"
          :style="textStyles" />
      </div>

      <button
        type="submit"
        class="add-button"
        @click.prevent="createTextThingie">
        add
      </button>

    </form>

  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'

import TextThingie from '@/components/thingies/text-thingie'

// ====================================================================== Export
export default {
  name: 'PropBoard',

  components: {
    TextThingie
  },

  props: {
    pagename: {
      type: String,
      required: false,
      default: ''
    },
    location: {
      type: Object,
      required: false,
      default: () => ({
        x: 0,
        y: 0
      })
    }
  },

  data () {
    return {
      open: false,
      text: '',
      status: false,
      fontsize: 13,
      fontfamily: 'nanum',
      color: '#000000',
      highlight: '#BDBBD7',
      key: 0
    }
  },

  computed: {
    ...mapGetters({
      landing: 'general/landing',
      touchmode: 'general/touchmode'
    }),
    fonts () {
      return this.landing.data.font_families
    },
    editorStyles () {
      if (this.touchmode) {
        return { '--thingie-color': this.color, '--propboard-highlight-color': this.highlight }
      }
      return {
        left: this.location.x + 'px',
        top: this.location.y + 'px',
        '--thingie-color': this.color,
        '--propboard-highlight-color': this.highlight
      }
    },
    pageName () {
      return this.pagename ? this.pagename : this.$route.params.id
    },
    textStyles () {
      return {
        'font-size': this.fontsize + 'px'
      }
    }
  },

  methods: {
    ...mapActions({
      postCreateThingie: 'collections/postCreateThingie'
    }),
    openEditor () {
      if (!this.open) {
        this.open = true
      }
    },
    closeEditor () {
      if (this.open) {
        this.open = false
      }
    },
    changeFontSize (direction) {
      const fs = this.fontsize
      if (direction === 'up') {
        this.fontsize = Math.min(500, fs + 1)
      }
      if (direction === 'down') {
        this.fontsize = Math.max(1, fs - 1)
      }
    },
    changeFontFamily () {
      const current = this.fonts.indexOf(this.fontfamily)
      const index = (current + 1) % this.fonts.length
      this.fontfamily = this.fonts[index]
    },
    changeColor (color, changeHighlight) {
      this.color = color
      if (changeHighlight) {
        this.highlight = this.color
      }
    },
    async createTextThingie () {
      const width = this.$refs.textArea ? this.$refs.textArea.clientWidth : 80
      const x = this.touchmode ? window.scrollX + Math.floor(Math.random() * window.innerWidth) - 80 : this.location.x
      const y = this.touchmode ? window.scrollY + Math.floor(Math.random() * window.innerHeight) - 300 : this.location.y
      const complete = await this.postCreateThingie({
        location: this.pageName,
        type: 'text',
        text: this.text,
        fontsize: this.fontsize,
        fontfamily: this.fontfamily,
        colors: [this.color],
        width,
        at: { x, y, z: 1 }
      })
      if (complete) {
        this.status = 'upload-finalized'
        this.closeEditor()
        this.key++
        this.text = ''
        this.color = '#000000'
        this.highlight = '#BDBBD7'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.prop-board {
  --propboard-highlight-color: $lavender;
  --thingie-color: #cbc0d9;
  position: absolute;
  padding: 0.25rem;
  width: 20rem;
  min-height: 8rem;
  // @include focusBoxShadowSmall;
  border-radius: 0.25rem;
  background-color: #ffffff;
  visibility: hidden;
  @include popOutAnimation;
  z-index: 100000;
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.5;
    box-shadow: 0 0 3px 3px var(--propboard-highlight-color);
    border-radius: 0.25rem;
  }
  &.open {
    visibility: visible;
    @include popInAnimation;
  }
  .text-input {
    color: var(--thingie-color);
  }
  &.touchmode {
    position: fixed;
    left: 1.5rem;
    bottom: calc($touchmodeToolbarHeight + 2.5rem);
    width: calc(100% - 4.5rem);
    height: 8rem;
  }
}

.text-form {
  position: relative;
  z-index: 1;
  height: 100%;
  min-height: 7.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.text-area-wrapper {
  flex-grow: 1;
  width: 100%;
}

.text-input {
  width: 100%;
  height: 100%;
  color: black;
}

.add-button {
  width: fit-content;
  align-self: flex-end;
  margin-right: 0.5rem;
  @include linkHover(#000000);
}

:deep(.text-thingie) {
  .thingie-editor {
    &.editor {
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
  }
}
</style>
