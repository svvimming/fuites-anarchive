<template>
  <div class="super-container viewport">

    <section class="spaze-container">
      <Nuxt />
    </section>


    <section :class="['pocket-wrapper', { open: pocketIsOpen }]">

      <button class="pocket-toggle" @click="togglePocket">Click Me!</button>

      <div class="pocket-container">
        <Pocket />
      </div>

    </section>

  </div>
</template>

<script>
// ====================================================================== Import
import Pocket from '@/modules/pocket/components/pocket'

// ====================================================================== Export
export default {
  name: 'spaze',

  components: {
    Pocket
  },

  data () {
    return {
      pocketIsOpen: true,
      tab: false
    }
  },

  mounted () {
    this.tab = (e) => {
      if (e.keyCode === 65) { this.togglePocket() }
    }
    document.addEventListener('keydown', this.tab)
  },

  beforeDestroy () {
    document.removeEventListener('keydown', this.tab)
  },

  methods: {
    togglePocket () {
      this.pocketIsOpen = !this.pocketIsOpen
    }
  }
}
</script>

<style lang="scss" scoped>
// /////////////////////////////////////////////////////////////// Scoped Styles
.super-container {
  position: relative;
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
  top: 0;
  left: 0;
  transform: translateX(-100%);
  color: rgba(tomato, 0.7);
  padding: 0.5rem;
  background-color: rgba(white, 0.7);
  transition: 200ms ease;
  &:hover {
    color: rgba(tomato, 1);
    background-color: rgba(white, 1);
  }
}

</style>
