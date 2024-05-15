<template>
  <div :class="['release', { active }]">

    <div
      class="image"
      @mouseover="$emit('over-release', slug)"
      @click="$emit('over-release', slug)">
      <img :src="image" :alt="`${slug}-album-artwork`" />
    </div>

    <div
      v-if="mobile"
      class="info"
      :style="{ height: `${infoHeight}px` }">
      <div
        ref="content"
        class="text-content">
        <div class="links mobile-only">
          <Button
            v-for="link in links"
            :key="link.text"
            :text="link.text"
            :tag="link.tag"
            :disabled="link.disabled"
            :to="link.to"
            class="release-link" />
        </div>
        <div class="name">
          {{ name }}
        </div>
        <div class="artist">
          {{ artist }}
        </div>
        <div
          class="description"
          v-html="description">
        </div>
      </div>
    </div>

    <div
      v-if="!mobile"
      class="links">
      <Button
        v-for="link in links"
        :key="link.text"
        :text="link.text"
        :tag="link.tag"
        :disabled="link.disabled"
        :to="link.to"
        :target="link.target"
        class="release-link" />
    </div>

  </div>
</template>

<script>
// ====================================================================== Import
import Button from '@/components/button'

// ====================================================================== Export
export default {
  name: 'ReleaseCard',

  components: {
    Button
  },

  props: {
    card: {
      type: Object,
      required: true
    },
    active: {
      type: Boolean,
      required: true,
      default: false
    },
    mobile: {
      type: Boolean,
      required: true,
      default: false
    }
  },

  data () {
    return {
      infoHeight: 0
    }
  },

  computed: {
    image () {
      return this.card.img
    },
    links () {
      return this.card.links
    },
    slug () {
      return this.card.slug
    },
    name () {
      return this.card.name
    },
    portal () {
      return this.links.find(item => item.tag === 'nuxt-link')
    },
    artist () {
      return this.card.artist
    },
    description () {
      return this.card.description
    }
  },

  watch: {
    active () {
      this.$nextTick(() => {
        const height = this.getInfoHeight()
        if (this.infoHeight !== height) {
          this.infoHeight = height
        }
      })
    }
  },

  mounted () {
    this.$nextTick(() => {
      this.infoHeight = this.getInfoHeight()
    })
  },

  methods: {
    getInfoHeight () {
      if (this.mobile && this.active && this.$refs.content) {
        return this.$refs.content.offsetHeight
      }
      return 0
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.release {
  width: toRem(200);
  margin-bottom: toRem(52);
  @include small {
    width: unset;
    margin-bottom: toRem(152);
  }
  @include mini {
    padding-right: 0;
  }
  &:first-child {
    margin-top: toRem(130);
    @include small {
      margin-top: calc(50vh - 32.5vw - 5rem);
    }
  }
  &:last-child {
    margin-bottom: toRem(130);
    @include small {
      margin-bottom: toRem(300);
    }
  }
  &.active {
    .image {
      transform: scale(1.66);
      @include small {
        transform: scale(1.1) translateY(-14px);
      }
      @include tiny {
        transform: none;
      }
    }
    .links {
      opacity: 1;
    }
  }
}

.image {
  width: toRem(120);
  height: toRem(120);
  margin: toRem(40);
  transition: transform 400ms ease;
  box-shadow: 4px 4px 14px rgba(0, 0, 0, 0.5);
  @include small {
    width: 100%;
    height: unset;
    margin: unset;
    margin-bottom: toRem(48);
  }
  @include mini {
    margin-bottom: toRem(32);
  }
  img {
    width: 100%;
    height: 100%;
  }
}

.info {
  transition: height 500ms ease;
  overflow: hidden;
}

.name,
.artist,
.description {
  color: white;
  @include fontFamily_Roboto;
  letter-spacing: 0.02em;
}

.name {
  padding-top: 0.5rem;
  margin-bottom: toRem(12);
  font-weight: 500;
  font-size: toRem(18);
}

.artist {
  @include fontFamily_FrauncesItalic;
  margin-bottom: toRem(28);
}

.description {
  line-height: 1.6;
  font-weight: 400;
  font-size: toRem(13);
}

.links {
  display: flex;
  justify-content: center;
  padding: 1.5rem 0;
  opacity: 0;
  transition: 350ms ease;
  &.mobile-only {
    padding: 0 0 1.5rem 0;
  }
}

.release-link {
  color: white;
  padding: 0;
  letter-spacing: toRem(1);
  &:not(:last-child) {
    margin-right: 1rem;
  }
  @include fontFamily_Roboto;
  ::v-deep .button-content {
    @include fontFamily_Roboto;
    font-size: toRem(14);
  }
  ::v-deep .tripe-dot-loader {
    display: none;
  }
  &:hover {
    font-weight: 700;
    letter-spacing: toRem(1.5);
  }
}
</style>
