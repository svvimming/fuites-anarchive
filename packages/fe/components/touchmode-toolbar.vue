<template>
  <div class="toolbar-container">
    <div class="grid-noGutter">
      <div class="col">
        <div :class="['touchmode-toolbar', { authenticated }]">

            <LandingSite
              :tips-open="tipsOpen"
              :mobile="true"
              page="spaze"
              :class="{ 'tips-open': tipsOpen }" />

            <button
              v-if="authenticated"
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
import { mapGetters } from 'vuex'
import LandingSite from '@/components/landing-site'
import Chevron from '@/components/icons/chevron'

// ====================================================================== Export
export default {
  name: 'TouchmodeToolbar',

  components: {
    LandingSite,
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
    }
  },

  data () {
    return {
      tipsOpen: false
    }
  },

  computed: {
    ...mapGetters({
      authenticated: 'general/authenticated'
    })
  },

  methods: {
    toggleTips () {
      this.tipsOpen = !this.tipsOpen
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
}
.touchmode-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: $touchmodeToolbarHeight;
}

:deep(.landing-site) {
  position: relative;
  top: unset;
  left: unset;
  width: 100%;
  .inner-panel {
    display: flex;
    padding: 0;
    width: 100%;
    align-items: center;
  }
  &.authenticated {
    position: absolute;
    width: unset;
    .inner-panel {
      position: fixed;
      padding: 2rem 1rem;
      top: 0;
      left: 0;
      width: 100%;
      height: calc(100% - $touchmodeToolbarHeight - 0.5px);
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
}

.tips-toggle {
  color: #000000;
  @include fontWeight_Bold;
  @include linkHover(#000000);
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