<template>
  <nuxt-link
    :to="`/${slug}`"
    class="portal"
    :style="portalStyles">
    <div class="portal-thingie"></div>
  </nuxt-link>
</template>

<script>
// ====================================================================== Export
export default {
  name: 'Portal',

  props: {
    to: {
      type: Object,
      required: true,
      default: () => ({})
    }
  },

  computed: {
    slug () {
      return this.to.slug
    },
    position () {
      return this.to.at ? this.to.at : { x: 0, y: 0 }
    },
    portalStyles () {
      return {
        left: this.position.x + 'px',
        top: this.position.y + 'px'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.portal {
  position: absolute;
}

.portal-thingie {
  width: 0.5rem;
  height: 0.5rem;
  background-color: tomato;
  border-radius: 50%;
}
</style>
