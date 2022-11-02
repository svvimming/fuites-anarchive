<template>
  <div class="super-container viewport">

    <Toaster />

    <!-- ================================================== Current SPAZE == -->
    <section class="spaze-container">

      <LandingSite :links="links" />

      <Nuxt />

    </section>

    <!-- ========================================================= POCKET == -->
    <Pocket />

    <button
      v-if="authenticated"
      :class="['toggle', { pocketIsOpen }, 'pocket-toggle']"
      @click="togglePocket">
      Pocket
    </button>

    <!-- ================================================= COMPOST PORTAL == -->
    <CompostPortal />

    <button
      v-if="authenticated"
      :class="['toggle', { compostPortalIsOpen }, 'compost-portal-toggle']"
      @click="toggleCompostPortal">
      trash
    </button>

  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'

import LandingSite from '@/components/landing-site'
import Pocket from '@/modules/pocket/components/pocket'
import CompostPortal from '@/modules/compost/components/compost-portal'
import Toaster from '@/modules/toaster/components/toaster'

import LandingSiteData from '@/data/landing.json'

// ====================================================================== Export
export default {
  name: 'spaze',

  components: {
    LandingSite,
    Pocket,
    CompostPortal,
    Toaster
  },

  computed: {
    ...mapGetters({
      authenticated: 'general/authenticated',
      pocketIsOpen: 'pocket/pocketIsOpen',
      compostPortalIsOpen: 'compost/compostPortalIsOpen'
    }),
    links () {
      return LandingSiteData.portal.links
    }
  },

  methods: {
    ...mapActions({
      setPocketIsOpen: 'pocket/setPocketIsOpen',
      setCompostPortalIsOpen: 'compost/setCompostPortalIsOpen'
    }),
    togglePocket () {
      this.setPocketIsOpen(!this.pocketIsOpen)
    },
    toggleCompostPortal () {
      this.setCompostPortalIsOpen(!this.compostPortalIsOpen)
    }
  }
}
</script>

<style lang="scss" scoped>
// /////////////////////////////////////////////////////////////// Scoped Styles
.super-container {
  position: relative;
  width: 100vw;
  height: 100vh;
}

.spaze-container,
.pocket-wrapper {
  position: absolute;
}

.spaze-container {
  z-index: 1;
  width: 100vw;
  height: 100vh;
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
  border: 2px solid rgba(white, 0.0);
  border-radius: 0.375rem;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' class='turbulence-bg'%3e%3cfilter id='filter'%3e%3cfeTurbulence result='1' x='0' y='0%25' width='100%25' height='100%25' baseFrequency='0.007' /%3e%3cfeMerge%3e%3cfeMergeNode in='1' /%3e%3c/feMerge%3e%3c/filter%3e%3crect width='100%25' height='100%25' opacity='0.5' filter='url(%23filter)' /%3e%3c/svg%3e");
  transition: 150ms ease-in-out;
  font-weight: bold;
  z-index: 10000;
  &:hover {
    background-color: rgba(255, 255, 255, 1);
    transform: scale(1.075);
  }
  &.pocketIsOpen {
    border: 2px solid white;
    background-color: rgba(255, 255, 255, 0.3);
    background-image: none;
    &:hover {
      background-color: rgba(255, 255, 255, 0.5);
    }
  }
}

.pocket-toggle {
  bottom: 2rem;
  right: 2.5rem;
  color: rgba(tomato, 0.85);
  &:hover {
    color: rgba(tomato, 1.0);
  }
  &.pocketIsOpen {
    border: 2px solid white;
    background-color: rgba(255, 255, 255, 0.3);
    background-image: none;
    &:hover {
      background-color: rgba(255, 255, 255, 0.5);
    }
  }
}

.compost-portal-toggle {
  bottom: 2rem;
  left: 2.5rem;
  color: rgba(SlateBlue, 0.85);
  &:hover {
    color: rgba(SlateBlue, 1.0);
  }
  &.compostPortalIsOpen {
    border: 2px solid white;
    background-color: rgba(255, 255, 255, 0.3);
    background-image: none;
    &:hover {
      background-color: rgba(255, 255, 255, 0.5);
    }
  }
}
</style>
