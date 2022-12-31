<template>
  <div
    id="modal"
    :class="{ active: modal }"
    @click.self="closeModal"
    @keyup.esc="closeModal">

    <section id="modal-section">

      <div class="toolbar">
        <button class="close-button" @click="closeModal">
          Close
        </button>
      </div>

      <div
        v-if="!authenticated"
        class="auth-wrapper">
        <Auth />
      </div>

      <div
        v-if="authenticated && newSpazeName"
        class="form-wrapper">
        <form
          class="form"
          @submit.prevent="submitSpazeData">

          <div
            v-for="(item, index) in textInputs"
            class="input-field merriweather">
            <label
              :for="item.input"
              class="label">
              {{ `${item.label}:` }}
            </label>
            <div class="input-wrapper">
              <input
                v-model="inputs[index]"
                type="text"
                class="input"
                :name="item.input"
                :disabled="item.disabled" />
            </div>
          </div>

        </form>

        <div
          class="uploader-wrapper">
          <SingleFileUploader
            :upload-on-draw-bicho="false"
            :upload-to-spaze="newSpazeName"
            init-prompt="Upload a file to the new spaze"
            final-prompt="Draw a shape to create the new spaze"
            @draw-bicho-complete="submitSpazeData" />
        </div>

      </div>

    </section>

  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'

import Auth from '@/components/auth'
import SingleFileUploader from '@/modules/pocket/components/single-file-uploader'
// ====================================================================== Export
export default {
  name: 'PopSpz',

  components: {
    Auth,
    SingleFileUploader
  },

  data () {
    return {
      inputs: []
    }
  },

  computed: {
    ...mapGetters({
      authenticated: 'general/authenticated',
      modal: 'general/modal',
      landing: 'general/landing'
    }),
    popSpzData () {
      return this.landing.data.portal.new_spaze
    },
    textInputs () {
      const traces = [
        {
          input: 'name',
          label: 'new spaze name',
          disabled: true
        }
      ]
      return traces.concat(this.popSpzData.form.traces)
    },
    newSpazeName () {
      return this.inputs[0]
    }
  },

  mounted () {
    this.inputs[0] = this.$route.params.id
  },

  methods: {
    ...mapActions({
      setModal: 'general/setModal'
    }),
    closeModal () {
      if (this.modal) {
        this.setModal(false)
      }
    },
    submitSpazeData () {
      console.log(this.inputs)
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
#modal {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  visibility: hidden;
  pointer-events: none;
  z-index: -1;
  &:before {
    content: '';
    position: absolute;
    top: inherit;
    left: inherit;
    width: inherit;
    height: inherit;
    background: rgba(0, 0, 0, 0.5);
    opacity: 0;
    z-index: 5;
    transition: 250ms ease-out;
  }
  &.active {
    visibility: visible;
    pointer-events: all;
    z-index: 10000;
    &:before {
      transition: 250ms ease-in;
      opacity: 1;
    }
    #modal-section {
      transition: 250ms 100ms ease-in;
      transform: translateY(0);
      opacity: 1;
    }
  }
}

// ///////////////////////////////////////////////////////////////////// Toolbar
.toolbar {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
}

.close-button {
  color: black;
  padding: 0.5rem 1rem;
}

// /////////////////////////////////////////////////////////////// [Modal] Video
#modal-section {
  position: relative;
  width: 50rem;
  opacity: 0;
  transform: translateY(2rem);
  z-index: 10;
  transition: 250ms ease-out;
  background-color: white;
}

// ////////////////////////////////////////////////////////////////////// [Form]
.auth-wrapper,
.form-wrapper {
  padding: 3rem;
}

:deep(.auth-container) {
  display: flex;
  flex-direction: column;
  max-width: 20rem;
  margin: 0 auto;
}

.input-field {
  display: flex;
  align-items: center;
  padding: 0.25rem 0;
  .label,
  .input {
    font-family: inherit;
    @include fontSize_Main;
    @include fontWeight_Bold;
    letter-spacing: 0.1em;
  }
}

.input {
  width: fit-content;
  min-width: 10rem;
}

.input-wrapper {
  margin: 0.25rem 0;
  margin-left: 1.5rem;
  position: relative;
  &:after {
    content: '';
    position: absolute;
    width: 100%;
    height: 1px;
    left: 0;
    bottom: -2px;
    background-color: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    opacity: 0.7;
    transition: 200ms ease;
  }
  &:hover {
    &:after {
      width: calc(100% + 1rem);
      left: -0.5rem;
    }
  }
}

.uploader-wrapper {
  margin-top: 2rem;
}
</style>
