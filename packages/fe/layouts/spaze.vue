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

      <div
        v-else
        class="input-wrapper"
        v-click-outside="test">
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
      </div>

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
    },
    test () {
      console.log('hit')
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

.pocket-wrapper {
  z-index: 100;
  right: 0;
  bottom: 0;
  width: auto;
  height: auto;
  transition: 250ms ease;
  transform: scale(0.8);
  opacity: 0;
  &.open {
    transform: scale(1);
    opacity: 1;
  }
}

.pocket-container {
  position: relative;
  width: 50vw;
  height: 25rem;
  overflow: hidden;
  transition: 250ms ease;
  padding: 1rem;
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
  // border: 1px solid rgba(black, 0.7);
  // background-color: rgba(255, 255, 255, 0.7);
  border-radius: 0.25rem;
  transition: 150ms ease-in-out;
  transform: translate(-2.5rem, -2rem);
  color: rgba(tomato, 0.7);
  z-index: 10000;
  &:hover {
    color: rgba(tomato, 0.9);
    // background-color: rgba(255, 255, 255, 1);
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
  width: 16rem;
  padding: 1rem;
  font-size: 0.8125rem;
  color: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  &.active {
    .input-wrapper {
      // display: block;
    }
    // background-color: rgba(255, 255, 255, 0.7);
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
  color: rgba(black, 0.7);
  border-radius: 0.25rem;
  transition: 150ms ease-in-out;
  &:hover {
    color: rgba(black, 0.9);
  }
}

.button-submit-auth {
  color: rgba(black, 0.7);
  &:hover {
    color: rgba(black, 0.9);
  }
}

.input-wrapper {
  // display: none;
  position: relative;
  flex: 1;
  margin-right: 0.25rem;
  &:after {
    content: '';
    position: absolute;
    width: calc(100% - 1rem);
    height: 1px;
    left: 0;
    bottom: -2px;
    background-color: rgba(0, 0, 0, 0.7);
    opacity: 0.7;
    transition: 200ms ease;
  }
  &:hover {
    &:after {
      width: 100%;
      left: -0.5rem;
      background-color: rgba(0, 0, 0, 0.9);
    }
  }
}
</style>
