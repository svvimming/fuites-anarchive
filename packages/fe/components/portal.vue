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

  data () {
    return {
      fallback: ['#BDBBD7', '#6c6575', '#ffffff']
    }
  },

  computed: {
    slug () {
      return this.to.slug
    },
    position () {
      return this.to.at ? this.to.at : { x: 0, y: 0 }
    },
    colors () {
      const colors = this.to.colors
      if (Array.isArray(colors)) {
        if (colors.length > 2) {
          return colors
        } else {
          const len = 3 - colors.length
          const hydrated = [...colors]
          for (let i = 0; i < len; i++) {
            hydrated.push(this.fallback[i])
          }
          return hydrated
        }
      }
      return [...this.fallback].reverse()
    },
    portalStyles () {
      return {
        left: this.position.x + 'px',
        top: this.position.y + 'px',
        '--portal-gradient-start': this.colors[0],
        '--portal-gradient-stop': this.colors[1],
        '--portal-hover-ring': this.colors[2]
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.portal {
  --portal-gradient-start: #ffffff;
  --portal-gradient-stop: #ffffff;
  --portal-hover-ring: #ffffff;
  position: absolute;
  .portal-thingie {
    &:before {
      background-color: var(--portal-gradient-start);
      filter: drop-shadow(0 0 0.125rem var(--portal-hover-ring)) drop-shadow(0 0 0.25rem var(--portal-hover-ring));
      opacity: 0;
    }
    &:after {
      background: radial-gradient(circle, var(--portal-gradient-start) 20%, var(--portal-gradient-stop) 55%, rgba(255, 255, 255, 0) 66%);
    }
  }
  &:hover {
    .portal-thingie {
      transform: scale(1.5);
      &:before {
        animation: 2s linear 0s infinite normal forwards running hoverRing;
      }
    }
  }
}

.portal-thingie {
  position: relative;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  z-index: 2;
  transition: 300ms ease;
  &:before,
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: inherit;
    height: inherit;
    border-radius: inherit;
    z-index: 1;
  }
}

@keyframes hoverRing {
  0%, 100% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}
</style>
