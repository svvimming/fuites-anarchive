<template>
  <div :class="['super-container', 'viewport', { 'page-compost': !notCompostPage }]">

    <Toaster />

    <PageCreator
      v-if="notCompostPage"
      @page-created="handleRefresh" />

    <!-- ================================================== Current PAGE == -->
    <Nuxt
      ref="page" 
      :key="`page-init-${key}`" />

    <!-- ==================================================== PORTAL VIEW == -->
    <button
      v-if="notCompostPage && !touchmode"
      :class="['toggle', { portalView }, 'portals-toggle', 'no-select']"
      @click="togglePortals">
      portals
    </button>

    <!-- ========================================================== AUDIO == -->
    <button
      v-if="!touchmode"
      :class="['toggle', { 'audio-active': audioContextState === 'running' }, 'audio-toggle']"
      @click="toggleAudioContext">
      audio
    </button>

    <!-- ========================================================== AUDIO == -->
    <button
      v-if="!touchmode"
      :class="['toggle', { 'video-active': videoPlaying }, 'video-toggle']"
      @click="toggleVideoPlayState">
      video
    </button>

    <!-- =================================================== LANDING SITE == -->
    <LandingSite
      v-if="!touchmode"
      :tips-open="tipsOpen"
      page="page" />

    <button
      v-if="authenticated && !touchmode"
      :class="['toggle', { tipsOpen }, 'tips-toggle', 'no-select']"
      @click="toggleTips">
      tips
    </button>

    <!-- ========================================================= POCKET == -->
    <Pocket :class="{ 'editor-active': editorThingie }" />

    <button
      v-if="authenticated && !modal && !editorThingie && !touchmode"
      :class="['toggle', { pocketIsOpen }, 'pocket-toggle']"
      @click="togglePocket">
      pocket
    </button>

    <!-- ======================================================== COMPOST == -->
    <CompostPortal v-if="!touchmode" />

    <button
      v-if="authenticated && notCompostPage && !modal && !touchmode"
      :class="['toggle', { compostPortalIsOpen }, 'compost-portal-toggle']"
      @click="toggleCompostPortal">
      compost
    </button>

    <button
      v-if="authenticated && !notCompostPage && !modal && !touchmode"
      :class="['toggle', 'delete-button']"
      @click="deleteThingie">
      delete
    </button>

    <!-- ================================================== TOUCH TOOLBAR == -->
    <TouchmodeToolbar 
      v-if="touchmode"
      :thingie="editorThingie"
      :pocket-is-open="pocketIsOpen"
      :portal-view="portalView"
      :audio-context-state="audioContextState"
      :editor-open="editorExpanded"
      :current-page="currentPage"
      @toggle-thingie-editor="toggleThingieEditor"
      @toggle-pocket="togglePocket"
      @toggle-portal-view="togglePortals"
      @toggle-audio-context="toggleAudioContext" />

    <!-- =================================================== TOUCH EDITOR == -->
    <TouchEditor 
      v-if="touchmode && currentPage"
      :current-page="currentPage"
      :expanded="editorExpanded"
      @initupdate="handleThingieUpdate"
      @delete-thingie="deleteThingie" />

  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'

import LandingSite from '@/components/landing-site'
import Pocket from '@/modules/pocket/components/pocket'
import CompostPortal from '@/modules/compost/components/compost-portal'
import Toaster from '@/modules/toaster/components/toaster'
import PageCreator from '@/components/page-creator'
import TouchEditor from '@/components/thingies/touch-editor'
import TouchmodeToolbar from '@/components/touchmode-toolbar'

// =================================================================== Functions
const isTouchDevice = () => {
  return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0))
}

const handleTouchStart = (e, instance) => {
  const targetId = e.target.getAttribute('data-thingie-id')
  if (targetId !== instance.editorThingie._id) {
    instance.clearEditorThingie()
  }
}

// ====================================================================== Export
export default {
  name: 'page',

  components: {
    LandingSite,
    Pocket,
    CompostPortal,
    Toaster,
    PageCreator,
    TouchEditor,
    TouchmodeToolbar
  },

  data () {
    return {
      prevRoute: '',
      tipsOpen: false,
      key: 0,
      touchstart: false,
      editorExpanded: false
    }
  },

  computed: {
    ...mapGetters({
      authenticated: 'general/authenticated',
      portalView: 'general/portalView',
      pocketIsOpen: 'pocket/pocketIsOpen',
      audioContext: 'mixer/audioContext',
      playState: 'mixer/playState',
      compostPortalIsOpen: 'compost/compostPortalIsOpen',
      modal: 'general/modal',
      touchmode: 'general/touchmode',
      videoPlaying: 'general/videoPlaying',
      editorThingie: 'collections/editorThingie',
      pages: 'collections/pages'
    }),
    audioContextState () {
      if (this.audioContext) { return this.playState }
      return false
    },
    notCompostPage () {
      return this.$route.params.id !== 'compost'
    },
    currentPage () {
      const name = this.$route.params.id
      const page = this.pages.find(item => item.name === name)
      if (page) { return page.name }
      return false
    }
  },

  watch: {
    '$route' (to, from) {
      if (from.params.id) {
        this.prevRoute = from.params.id
      } else {
        this.prevRoute = from.name
      }
    },
    notCompostPage (val) {
      if (!val && this.compostPortalIsOpen) {
        this.toggleCompostPortal()
      }
    },
    editorThingie (val) {
      if (!val && this.editorExpanded) {
        this.editorExpanded = false
      } 
    }
  },

  mounted () {
    if (isTouchDevice()) {
      this.setTouchMode(true)
      this.touchstart = (e) => { handleTouchStart(e, this) }
      document.addEventListener('touchstart', this.touchstart)
    }
  },

  beforeDestroy () {
    if (this.touchstart) { document.removeEventListener('touchstart', this.touchstart) }
  },

  methods: {
    ...mapActions({
      setPortalView: 'general/setPortalView',
      setPocketIsOpen: 'pocket/setPocketIsOpen',
      setCompostPortalIsOpen: 'compost/setCompostPortalIsOpen',
      createAudioContext: 'mixer/createAudioContext',
      setAudioContextPlayState: 'mixer/setAudioContextPlayState',
      setTouchMode: 'general/setTouchMode',
      clearEditorThingie: 'collections/clearEditorThingie',
      postDeleteThingie: 'collections/postDeleteThingie',
      setVideoPlayState: 'general/setVideoPlayState'
    }),
    toggleTips () {
      this.tipsOpen = !this.tipsOpen
    },
    togglePocket () {
      this.setPocketIsOpen(!this.pocketIsOpen)
    },
    toggleCompostPortal () {
      this.setCompostPortalIsOpen(!this.compostPortalIsOpen)
    },
    togglePortals () {
      this.setPortalView(!this.portalView)
    },
    toggleAudioContext () {
      if (!this.audioContext) {
        this.createAudioContext()
      } else {
        this.setAudioContextPlayState(this.audioContextState)
      }
    },
    toggleVideoPlayState () {
      this.setVideoPlayState(!this.videoPlaying)
    },
    handleRefresh () {
      this.key++
    },
    handleThingieUpdate (update) {
      if (this.editorThingie) {
        $nuxt.$emit('init-update-thingie-global', update)
      }
    },
    toggleThingieEditor () {
      this.editorExpanded = !this.editorExpanded
    },
    async deleteThingie () {
      const id = this.editorThingie._id
      if (id) {
        const deleted = await this.postDeleteThingie({ id })
        if (deleted) {
          this.clearEditorThingie()
        }
        this.$toaster.addToast({
          type: 'toast',
          category: deleted ? 'success' : 'error',
          message: 'thingie deleted! 💨'
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// /////////////////////////////////////////////////////////////// Scoped Styles
.super-container {
  position: relative;
  width: 100%;
  height: 100%;
  // &.page-compost {
  //   overflow: hidden;
  // }
}

.page-container {
  position: absolute;
  z-index: 1;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.toggle {
  position: fixed;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
  height: 2rem;
  z-index: 10000;
}

.tips-toggle {
  top: 2rem;
  left: 2.5rem;
  color: #000000;
  @include fontWeight_Bold;
  @include linkHover(#000000);
}

.pocket-toggle {
  bottom: 2rem;
  right: 2.5rem;
  color: #FA8072;
  @include fontWeight_Bold;
  @include linkHover(#FA8072);
}

.compost-portal-toggle,
.delete-button {
  bottom: 2rem;
  left: 2.5rem;
}

.compost-portal-toggle {
  color: #6A5ACD;
  @include fontWeight_Bold;
  @include linkHover(#6A5ACD);
}

.delete-button {
  color: #2d0b3d;
  @include fontWeight_Bold;
  @include linkHover(#2d0b3d);
}

.portals-toggle {
  top: 2rem;
  right: 2.5rem;
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
  top: 4rem;
  right: 2.5rem;
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

.video-toggle {
  top: 6rem;
  right: 2.5rem;
  color: #b88a37;
  @include fontWeight_Bold;
  @include linkHover(#b88a37);
  &:before {
    content: '';
    position: absolute;
    width: calc(100% - 1rem);
    left: 0.5rem;
    top: calc(50% + 1px);
    border-top: 1px solid #b88a37;
  }
  &.video-active {
    &:before {
      display: none;
    }
  }
}

</style>
