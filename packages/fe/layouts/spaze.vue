<template>
  <div class="super-container viewport">

    <Toaster />

    <!-- ================================================== Current SPAZE == -->
    <section class="spaze-container">

      <Nuxt />

    </section>

    <!-- =================================================== LANDING SITE == -->

    <LandingSite :links="links" :tips="tips" :tips-open="tipsOpen" />

    <button
      v-if="authenticated"
      :class="['toggle', { tipsOpen }, 'tips-toggle', 'no-select']"
      @click="toggleTips">
      tips
    </button>

    <!-- ========================================================= POCKET == -->
    <Pocket />

    <button
      v-if="authenticated"
      :class="['toggle', { pocketIsOpen }, 'pocket-toggle']"
      @click="togglePocket">
      pocket
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

  data () {
    return {
      tipsOpen: false
    }
  },

  computed: {
    ...mapGetters({
      authenticated: 'general/authenticated',
      pocketIsOpen: 'pocket/pocketIsOpen',
      compostPortalIsOpen: 'compost/compostPortalIsOpen'
    }),
    links () {
      return LandingSiteData.portal.links
    },
    tips () {
      return LandingSiteData.portal.tips
    }
  },

  methods: {
    ...mapActions({
      setPocketIsOpen: 'pocket/setPocketIsOpen',
      setCompostPortalIsOpen: 'compost/setCompostPortalIsOpen'
    }),
    toggleTips () {
      this.tipsOpen = !this.tipsOpen
    },
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

.compost-portal-toggle {
  bottom: 2rem;
  left: 2.5rem;
  color: #6A5ACD;
  @include fontWeight_Bold;
  @include linkHover(#6A5ACD);
}
</style>
