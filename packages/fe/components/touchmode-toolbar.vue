<template>
  <div :class="['toolbar-container', { open: touchToolbar }]">

    <button
      class="toolbar-toggle"
      @click="toggleToolbar">
      <span class="text">
        tools
      </span>
      <Chevron />
    </button>

    <PropBoard
      v-if="authenticated && currentPage"
      ref="touchPropboard"
      :pagename="currentPage" />

    <LandingSite
      :tips-open="tipsOpen"
      :mobile="true"
      page="page"
      :class="{ 'tips-open': tipsOpen }" />

    <div class="grid-noGutter">
      <div class="col">
        <div :class="['touchmode-toolbar', { authenticated }]">

            <button
              v-if="authenticated && thingie"
              type="button"
              :data-thingie-id="thingie._id"
              :disabled="!thingie._id"
              :class="[
                'touch-button', 
                'toggle', 
                'editor-toggle', 
                { disabled: !thingie._id }, 
                { editorOpen }
              ]"
              @click="$emit('toggle-thingie-editor')">
              <span 
                class="text"
                :data-thingie-id="thingie._id">edit</span>
              <Chevron :thingie-id="thingie._id" />
            </button>

            <button
              v-if="authenticated && !thingie"
              :class="['toggle', 'prop-board-toggle', { disabled: pocketIsOpen || tipsOpen }, { propboardOpen }]"
              :disabled="pocketIsOpen || tipsOpen"
              @click="togglePropboard">
              propboard
            </button>

            <button
              v-if="authenticated"
              :class="['toggle', { pocketIsOpen }, 'pocket-toggle']"
              @click="$emit('toggle-pocket')">
              pocket
            </button>

            <button
              v-if="authenticated"
              :class="['toggle', { tipsOpen }, 'tips-toggle', 'no-select']"
              @click="tipsOpen = !tipsOpen">
              tips
            </button>

            <div class="public-controls">
              <button
                :class="['toggle', { portalView }, 'portals-toggle', 'no-select']"
                @click="$emit('toggle-portal-view')">
                portals
              </button>
              <button
                :class="['toggle', { 'audio-active': audioContextState === 'running' }, 'audio-toggle']"
                @click="$emit('toggle-audio-context')">
                audio
              </button>
            </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'

import LandingSite from '@/components/landing-site'
import PropBoard from '@/components/prop-board'
import Chevron from '@/components/icons/chevron'

// ====================================================================== Export
export default {
  name: 'TouchmodeToolbar',

  components: {
    LandingSite,
    PropBoard,
    Chevron
  },

  props: {
    thingie: {
      type: [Boolean, Object],
      required: true,
      default: false
    },
    pocketIsOpen: {
      type: Boolean,
      required: true,
      default: false
    },
    portalView: {
      type: Boolean,
      required: true,
      default: true
    },
    audioContextState: {
      type: [Boolean, String],
      required: true,
      default: 'paused'
    },
    editorOpen: {
      type: Boolean,
      required: false,
      default: false
    },
    currentPage: {
      type: [Boolean, String],
      required: true,
      default: false
    }
  },

  data () {
    return {
      tipsOpen: false,
      propboardOpen: false
    }
  },

  computed: {
    ...mapGetters({
      authenticated: 'general/authenticated',
      editorThingie: 'collections/editorThingie',
      touchToolbar: 'general/touchToolbar'
    })
  },

  watch: {
    editorThingie (val) {
      if (val) { this.closePropboard() }
    },
    pocketIsOpen (val) {
      if (val) { this.closePropboard() }
    },
    tipsOpen (val) {
      if (val) { this.closePropboard() }
    }
  },

  methods: {
    ...mapActions({
      setTouchToolbar: 'general/setTouchToolbar'
    }),
    toggleTips () {
      this.tipsOpen = !this.tipsOpen
    },
    togglePropboard () {
      const propboard = this.$refs.touchPropboard
      if (propboard) {
        if (propboard.open) {
          propboard.closeEditor()
          this.propboardOpen = false
        } else {
          propboard.openEditor()
          this.propboardOpen = true
        }
      }
    },
    closePropboard () {
      const propboard = this.$refs.touchPropboard
      if (propboard && propboard.open) {
        propboard.closeEditor()
        this.propboardOpen = false
      }
    },
    toggleToolbar () {
      this.setTouchToolbar(!this.touchToolbar)
      if (this.pocketIsOpen) {
        this.$emit('toggle-pocket')
      }
    }
  }
}
</script>

<style lang="scss" scoped>

// ///////////////////////////////////////////////////////////////////// General
.toolbar-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  border-top: solid 0.5px rgba($salt, 0.3);
  background-color: white;
  z-index: 10000;
  transform: translateY(100%);
  transition: 200ms ease;
  &.open {
    transform: translateY(0);
    .toolbar-toggle {
      :deep(.icon-chevron) {
        transform: rotate(0deg);
      }
    }
  }
}

.touchmode-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: $touchmodeToolbarHeight;
}

.toolbar-toggle {
  position: absolute;
  display: flex;
  align-items: center;
  padding: 0.25rem 0.875rem 0.125rem 0.875rem;
  top: 0;
  left: 1rem;
  color: #7e7c8f;
  transform: translateY(-100%);
  background-color: white;
  border: solid 1px $lavender;
  border-top-left-radius: 1.25rem;
  border-top-right-radius: 1.25rem;
  border-bottom: none;
  span {
    margin-right: 0.5rem;
  }
  :deep(.icon-chevron) {
    width: 7px;
    height: 6px;
    transition: 200ms ease;
    transform: rotate(180deg);
  }
}

:deep(.landing-site) {
  position: absolute;
  top: unset !important;
  bottom: $touchmodeToolbarHeight;
  left: unset;
  width: 100%;
  .inner-panel {
    display: flex;
    padding: 0;
    width: 100%;
    align-items: center;
  }
  &.authenticated {
    .inner-panel {
      position: absolute;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 2rem 1rem;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 2000px;
      overflow: scroll;
      background-color: rgba(white, 0.0);
      visibility: hidden;
      transition: 200ms ease;
      @include popInAnimation;
    }
    &.tips-open {
      .inner-panel {
        visibility: visible;
        background-color: rgba(white, 0.9);
      }
    }
  }
}

:deep(.fuites) {
  margin: 0 1rem 0 0;
  width: 80px;
  height: 2.5rem;
}

// /////////////////////////////////////////////////////////.//// Token Controls 
.toggle {
  padding: 0.375rem 1rem;
  @include fontWeight_Bold;
  font-size: 1.125rem;
  margin: 0.25rem;
  box-shadow: 1px 1px 7px rgba($lavender, 0.5);
  border-radius: 0.25rem;
  &.disabled {
    opacity: 0.33;
  }
  @include tiny {
    font-size: 1rem;
  }
}

.editor-toggle {
  display: flex;
  align-items: center;
  .text {
    display: block;
    margin-right: 0.25rem;
  }
  :deep(.icon-chevron) {
    width: 7px;
    height: 6px;
    transition: 200ms ease;
    transform: rotate(180deg);
  }
  &.disabled {
    opacity: 0.33;
  }
  &.editorOpen {
    :deep(.icon-chevron) {
      transform: rotate(0deg);
    }
  }
}

.pocket-toggle {
  color: #FA8072;
  @include fontWeight_Bold;
  @include linkHover(#FA8072);
  &.pocketIsOpen {
    color: white;
    background-color: #FA8072;
  }
}

.tips-toggle {
  color: #000000;
  @include fontWeight_Bold;
  @include linkHover(#000000);
  &.tipsOpen {
    color: white;
    background-color: $salt;
  }
}

.prop-board-toggle {
  color: #8c8aa1;
  @include fontWeight_Bold;
  @include linkHover(#8c8aa1);
  &.disabled {
    opacity: 0.5;
  }
  &.propboardOpen {
    color: white;
    background-color: #8c8aa1;
  }
}

// ///////////////////////////////////////////////////////////// Public Controls 
.public-controls {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  .toggle {
    display: block;
  }
}

.portals-toggle {
  color: #60a184;
  @include fontWeight_Bold;
  @include linkHover(#60a184);
  &:before {
    content: '';
    position: absolute;
    width: calc(100% - 1rem);
    left: 0.5rem;
    top: calc(50% + 1px);
    border-top: 1px solid #60a184;
  }
  &.portalView {
    &:before {
      display: none;
    }
  }
}

.audio-toggle {
  color: #9e6c86;
  @include fontWeight_Bold;
  @include linkHover(#9e6c86);
  &:before {
    content: '';
    position: absolute;
    width: calc(100% - 1rem);
    left: 0.5rem;
    top: calc(50% + 1px);
    border-top: 1px solid #9e6c86;
  }
  &.audio-active {
    &:before {
      display: none;
    }
  }
}

</style>
