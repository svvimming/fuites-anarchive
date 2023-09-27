<template>
  <div
    :data-thingie-id="thingieId"
    :class="['css-breakout-box', { active }]">
    <textarea
      v-model="styles"
      :data-thingie-id="thingieId"
      class="code-area courier">
    </textarea>
    <button
      type="submit"
      :data-thingie-id="thingieId"
      class="submit-button"
      @click="addStyles">
      add
    </button>
  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters } from 'vuex'

// ====================================================================== Export
export default {
  name: 'CssBreakoutBox',

  props: {
    active: {
      type: Boolean,
      required: true,
      default: false
    }
  },

  data () {
    return {
      styles: ''
    }
  },

  computed: {
    ...mapGetters({
      editorThingie: 'collections/editorThingie'
    }),
    thingieId () {
      if (this.editorThingie) { return this.editorThingie._id }
      return ''
    }
  },

  watch: {
    active (val) {
      if (val) {
        document.onkeydown = null
        this.setStylesFromEditorThingie()
      }
    },
    editorThingie (val) {
      if (val && this.active) {
        document.onkeydown = null
      }
      if (val) {
        this.setStylesFromEditorThingie()
      }
    }
  },

  mounted () {
    this.setStylesFromEditorThingie()
  },

  methods: {
    setStylesFromEditorThingie () {
      const thingie = this.editorThingie
      if (thingie && Array.isArray(thingie.css) && thingie.css.length) {
        this.styles = `{\n${this.editorThingie.css.join(';\n') + ';'}\n}`
      } else if (thingie) {
        this.styles = '{}'
      } else {
        this.styles = ''
      }
    },
    addStyles () {
      if (this.editorThingie) {
        let styles = this.styles
        styles = styles.replace(/[{}]/g, '')
        styles = styles.replace(/(?:\r\n|\r|\n)/g, '')
        const properties = styles.split(';').map(line => line.trim()).filter(line => line !== '')
        console.log(properties)
        this.$emit('update-css-properties', {
          _id: this.editorThingie._id,
          css: properties
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.css-breakout-box {
  position: fixed;
  top: 5.5rem;
  left: 2.5rem;
  visibility: hidden;
  @include popOutAnimation;
  z-index: 1;
  background-color: white;
  box-shadow: 0 0 3px 3px $lavender;
  border-radius: 0.25rem;
  padding: 0.5rem;
  &.active {
    visibility: visible;
    @include popInAnimation;
    z-index: 100000;
  }
}

.code-area {
  background: #3d3942;
  color: #d1d0db;
  border-radius: 0.125rem;
  padding: 0.25rem;
  display: block;
  width: 22rem;
  height: 16rem;
  @include fontSize_Main;
  padding-bottom: 1.5rem;
}

.submit-button {
  position: absolute;
  bottom: 1rem;
  right: 1.5rem;
  color: #d1d0db;
  @include link;
  @include linkHover(#d1d0db);
}
</style>
