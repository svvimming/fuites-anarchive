<template>
  <nuxt-link
    :to="`/${slug}`"
    class="portal"
    :style="portalStyles">

    <div class="portal-thingie">
      <div
        v-if="print"
        class="page-preview"
        :style="pagePreview">
      </div>
    </div>

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
      fallback: ['#BDBBD7', '#6c6575', '#ffffff'],
      print: ''
    }
  },

  async fetch () {
    const response = await this.$axiosAuth.get(`/${this.$config.mongoInstance}/get-page-background?page=${this.to.slug}`)
    if (response.data.payload) {
      this.print = response.data.payload.data_url
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
        '--portal-gradient-stop': `${this.colors[1]}80`,
        '--portal-hover-ring': `${this.colors[2]}80`
      }
    },
    pagePreview () {
      return this.print ? { 'background-image': `url(${this.print})` } : { 'background-image': 'none' }
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
  z-index: 10000;
  user-select: none;
  -webkit-user-drag: none;
  .page-preview {
    filter: drop-shadow(0px 0px 2px var(--portal-gradient-stop));
  }
  .portal-thingie {
    &:before {
      background-color: var(--portal-hover-ring);
      filter: drop-shadow(0 0 0.125rem var(--portal-hover-ring)) drop-shadow(0 0 0.25rem var(--portal-hover-ring));
      opacity: 0;
    }
    &:after {
      background: radial-gradient(circle, var(--portal-gradient-start) 10%, var(--portal-gradient-stop) 30%, rgba(255, 255, 255, 0) 66%);
    }
  }
  &:hover {
    .portal-thingie {
      transform: scale(2.5);
      &:before {
        animation: 2s linear 0s infinite normal forwards running hoverRing;
      }
      &:after {
        transform: scale(3);
        background: radial-gradient(circle, var(--portal-gradient-start) 5%, var(--portal-gradient-stop) 20%, rgba(255, 255, 255, 0) 66%);
      }
    }
    .page-preview {
      opacity: 1;
    }
  }
}

.page-preview {
  position: absolute;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  background-position: center;
  background-size: 100%;
  background-repeat: no-repeat;
  opacity: 0;
  transition: 300ms ease;
}

.portal-thingie {
  position: relative;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  z-index: 2;
  transition: 300ms ease;
  opacity: 0.9;
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
