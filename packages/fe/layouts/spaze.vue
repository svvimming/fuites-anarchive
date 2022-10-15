<template>
  <div class="super-container viewport">

    <Toaster />

    <section class="spaze-container">
      <Nuxt />
    </section>

    <section :class="['pocket-wrapper', { open: pocketIsOpen }]">
      <div class="pocket-container">
        <Pocket />
      </div>
    </section>

    <button
      v-if="authenticated"
      class="pocket-toggle"
      @click="togglePocket">
      Pocket
    </button>

    <div
      v-if="!authenticated"
      :class="['auth-container', { active: authPanelOpen }]">
      <button
        v-if="!authPanelOpen"
        class="button-open-auth"
        @click="toggleAuthPanel(true)">
        🔑
      </button>
      <input
        v-if="authPanelOpen"
        v-model="token"
        type="password"
        autocomplete="off"
        class="input" />
      <button
        v-if="authPanelOpen"
        class="button-submit-auth"
        @click="authenticate(token)">
        submit
      </button>
      <button
        v-if="authPanelOpen"
        class="button-close-auth"
        @click="toggleAuthPanel(false)">
        ❌ cancel
      </button>
    </div>

  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'

import Pocket from '@/modules/pocket/components/pocket'
import Toaster from '@/modules/toaster/components/toaster'

// ====================================================================== Export
export default {
  name: 'spaze',

  components: {
    Pocket,
    Toaster
  },

  data () {
    return {
      pocketIsOpen: false,
      authPanelOpen: false,
      token: ''
    }
  },

  computed: {
    ...mapGetters({
      authenticated: 'general/authenticated'
    })
  },

  methods: {
    ...mapActions({
      authenticate: 'general/authenticate'
    }),
    togglePocket () {
      this.pocketIsOpen = !this.pocketIsOpen
    },
    toggleAuthPanel (status) {
      this.authPanelOpen = status
      if (!status) {
        this.token = ''
      }
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
  background-color: rgba(255, 0, 255, 0.1);
}

.pocket-wrapper {
  z-index: 100;
  right: 0;
  top: 0;
  width: auto;
  height: auto;
  transition: 250ms ease;
  transform: translateX(100%);
  &.open {
    transform: translateX(0%);
  }
}

.pocket-container {
  position: relative;
  width: 50vw;
  height: 100vh;
  overflow: hidden;
  transition: 250ms ease;
  background-color: rgba(0, 255, 100, 0.1);
}

.pocket-toggle {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
  bottom: 0;
  right: 0;
  // width: 2rem;
  height: 2rem;
  border: 1px solid rgba(black, 0.7);
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 0.25rem;
  transition: 150ms ease-in-out;
  transform: translate(-1.5rem, -1rem);
  color: tomato;
  z-index: 10000;
  &:hover {
    color: tomato;
    background-color: rgba(255, 255, 255, 1);
  }
}

// ////////////////////////////////////////////////////////////// authentication
.auth-container {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  position: absolute;
  bottom: 0;
  right: 0;
  width: 100%;
  padding: 1rem;
  color: rgba(black, 0.7);
  z-index: 1000;
  &.active {
    background-color: rgba(255, 255, 255, 0.7);
  }
}

.button-open-auth {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid rgba(black, 0.7);
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 0.25rem;
  transition: 150ms ease-in-out;
  &:hover {
    background-color: rgba(255, 255, 255, 1);
  }
}

.input {
  flex: 1;
  margin-right: 2rem;
  padding: 0.5rem;
  border: 1px solid rgba(black, 0.7);
  border-radius: 0.25rem;
  background-color: rgba(255, 255, 255, 0.7);
  &:hover {
    background-color: rgba(255, 255, 255, 1);
  }
}
</style>
