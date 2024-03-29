<template>
  <div
    id="modal"
    :class="{ active: modal }">

    <section id="modal-section">

      <div
        v-if="!authenticated"
        class="auth-wrapper">
        <Auth />
      </div>

      <div
        v-if="authenticated && newPageName"
        class="form-wrapper">

        <form
          :key="key"
          class="form"
          @submit.prevent="createNewPageFrom404">

          <div
            v-for="(item, index) in inputs"
            :key="item.input"
            class="input-field merriweather">
            <label
              :for="item.input"
              class="label">
              {{ item.label }}
            </label>
            <div class="input-wrapper">
              <input
                v-model="inputs[index].value"
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
            ref="uploader"
            :upload-on-draw-bicho="false"
            :upload-to-page="newPageName"
            :init-prompt="`Upload a file to create ${newPageName}`"
            :final-prompt="`Draw a shape to create ${newPageName}`"
            @draw-bicho-complete="createNewPageFrom404"
            @upload-finalized="successfullyCreated" />
        </div>

      </div>

    </section>

  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'
import CloneDeep from 'lodash/cloneDeep'

import Auth from '@/components/auth'
import SingleFileUploader from '@/modules/pocket/components/single-file-uploader'
// ====================================================================== Export
export default {
  name: 'PageCreator',

  components: {
    Auth,
    SingleFileUploader
  },

  data () {
    return {
      key: 0,
      inputs: [
        {
          input: 'name',
          label: 'new page name:',
          disabled: true,
          value: ''
        }
      ]
    }
  },

  computed: {
    ...mapGetters({
      authenticated: 'general/authenticated',
      modal: 'general/modal',
      landing: 'general/landing'
    }),
    newPageName () {
      return this.inputs[0].value
    }
  },

  mounted () {
    this.inputs[0].value = this.$route.params.id
  },

  methods: {
    ...mapActions({
      setModal: 'general/setModal',
      postCreatePage: 'collections/postCreatePage'
    }),
    closeModal () {
      if (this.modal) {
        this.setModal(false)
      }
    },
    async createNewPageFrom404 () {
      const consistencies = this.inputs.filter(item => item.input !== 'name').map(item => item.value)
      const complete = await this.postCreatePage({
        page_name: this.inputs[0].value,
        consistencies
      })
      if (complete) {
        if (this.$refs.uploader.$children[0]) {
          const uploadInput = this.$refs.uploader.$children[0]
          uploadInput.uploadFile()
        }
      }
    },
    successfullyCreated () {
      this.$nuxt.refresh()
      this.$emit('page-created')
      this.closeModal()
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
      opacity: 1;
      @include popInAnimation;
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
  justify-content: center;
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
