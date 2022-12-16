<template>
  <div
    :key="`prop-board-instance-${key}`"
    :class="['prop-board', { open }]"
    :style="editorStyles">

    <Editor
      :open="true"
      type="text"
      @change-font-size="changeFontSize"
      @change-font-family="changeFontFamily"
      @change-color="changeColor" />

    <form action="" class="text-form">

      <div class="text-area-wrapper">
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

import Editor from '@/components/thingies/editor'

// ====================================================================== Export
export default {
  name: 'PropBoard',

  components: {
    Editor
  },

  props: {
    spz: {
      type: String,
      required: false,
      default: ''
    },
    location: {
      type: Object,
      required: true,
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
      key: 0
    }
  },

  computed: {
    ...mapGetters({
      landing: 'general/landing'
    }),
    fonts () {
      return this.landing.data.font_families
    },
    editorStyles () {
      return {
        left: this.location.x + 'px',
        top: this.location.y + 'px',
        '--thingie-color': this.color
      }
    },
    spazeName () {
      return this.spz ? this.spz : this.$route.params.id
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
    changeColor (color) {
      this.color = color
    },
    async createTextThingie () {
      const complete = await this.postCreateThingie({
        location: this.spazeName,
        type: 'text',
        text: this.text,
        fontsize: this.fontsize,
        fontfamily: this.fontfamily,
        colors: [this.color],
        at: {
          x: this.location.x,
          y: this.location.y,
          z: 1
        }
      })
      if (complete) {
        this.status = 'upload-finalized'
        this.closeEditor()
        this.key++
        this.text = ''
        this.color = '#000000'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.prop-board {
  --thingie-color: #cbc0d9;
  position: absolute;
  padding: 0.25rem;
  width: 20rem;
  height: 8rem;
  @include focusBoxShadowSmall;
  border-radius: 0.25rem;
  background-color: #ffffff;
  visibility: hidden;
  @include popOutAnimation;
  z-index: 100000;
  // &:before {
  //   content: '';
  //   position: absolute;
  //   top: 0;
  //   left: 0;
  //   width: 100%;
  //   height: 100%;
  //   opacity: 0.5;
  //   box-shadow: 0 0 3px 3px var(--thingie-color);
  //   border-radius: 0.25rem;
  // }
  &.open {
    visibility: visible;
    @include popInAnimation;
  }
  .text-input {
    color: var(--thingie-color);
  }
}

.text-form {
  position: relative;
  z-index: 1;
  height: 100%;
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

:deep(.thingie-editor.open) {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 0;
  box-shadow: none;
  z-index: 1;
}
</style>
