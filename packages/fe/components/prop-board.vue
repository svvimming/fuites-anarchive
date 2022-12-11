<template>
  <div
    :class="['prop-board', { open }]"
    :style="editorStyles">
    <form action="" class="text-form">

      <div class="text-area-wrapper">
        <textarea v-model="text" class="text-input" />
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
import { mapActions } from 'vuex'

// ====================================================================== Export
export default {
  name: 'PropBoard',

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
      status: false
    }
  },

  computed: {
    editorStyles () {
      return {
        left: this.location.x + 'px',
        top: this.location.y + 'px'
      }
    },
    spazeName () {
      return this.spz ? this.spz : this.$route.params.id
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
        location: this.spazeName,
        text: this.text,
        type: 'text',
        at: {
          x: this.location.x,
          y: this.location.y,
          z: 1
        }
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
  padding: 0.25rem;
  width: 20rem;
  height: 8rem;
  @include focusBoxShadowSmall;
  border-radius: 0.25rem;
  background-color: #ffffff;
  visibility: hidden;
  @include popOutAnimation;
  z-index: 100000;
  &.open {
    visibility: visible;
    @include popInAnimation;
  }
}

.text-form {
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
}

.add-button {
  width: fit-content;
  align-self: flex-end;
  margin-right: 0.5rem;
  @include linkHover(#000000);
}
</style>
