<template>
  <div
    :class="['prop-board', { open }]"
    :style="editorStyles">
    <form action="">

      <div class="text-area-wrapper">
        <textarea v-model="text" class="text-input" />
      </div>

      <button
        type="submit"
        @click.prevent="createTextThingie">
        submit
      </button>

    </form>
  </div>
</template>

<script>
// ====================================================================== Import
import { mapActions } from 'vuex'

// ====================================================================== Export
export default {
  name: 'PropBoard',

  props: {
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
      status: false
    }
  },

  computed: {
    editorStyles () {
      return {
        left: this.location.x + 'px',
        top: this.location.y + 'px'
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
    async createTextThingie () {
      const complete = await this.postCreateThingie({
        location: 'spaze',
        text: this.text,
        type: 'text'
      })
      if (complete) {
        this.status = 'upload-finalized'
        this.closeEditor()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.prop-board {
  position: absolute;
  border: 1px solid black;
  visibility: hidden;
  &.open {
    visibility: visible;
  }
}
</style>
