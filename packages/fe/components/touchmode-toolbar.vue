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
              :class="['touch-button', 'toggle', { disabled: !thingie._id }]"
              :disabled="!thingie._id"
              @click="$emit('toggle-thingie-editor')">
              edit
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

// ====================================================================== Export
export default {
  name: 'TouchmodeToolbar',

  components: {
    LandingSite
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
  // &.authenticated {
  //   justify-content: flex-start;
  // }
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
    width: unset;
    .inner-panel {
      position: fixed;
      padding: 2rem 1rem;
      top: 0;
      left: 0;
      width: 100vw;
      height: calc(100vh - $touchmodeToolbarHeight - 0.5px);
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
  &.disabled {
    opacity: 0.33;
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
