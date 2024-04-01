<template>
  <div :class="['release', { active }]">

    <div
      class="image"
      @mouseover="$emit('over-release', name)"
      @click="$emit('over-release', name)">
      <img :src="image" :alt="`${name}-album-artwork`" />
    </div>

    <div class="name">
      {{ name }}
    </div>
    
    <div
      v-if="mobile"
      class="info"
      :style="{ height: `${infoHeight}px` }">
      <div
        ref="content"
        class="text-content">
        <div class="artist">
          {{ artist }}
        </div>
        <div class="description">
          {{ description }}
        </div>
        <div
          v-if="mobile"
          class="links mobile-only">
          <Button
            v-for="link in links"
            :key="link.text"
            :text="link.text"
            :tag="link.tag"
            :disabled="link.disabled"
            :to="link.to"
            class="release-link" />
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
      const height = this.getInfoHeight()
      if (this.infoHeight !== height) {
        this.infoHeight = height
      }
    }
  },

  mounted () {
    this.infoHeight = this.getInfoHeight()
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
  max-width: toRem(210);
  margin-bottom: toRem(52);
  @include small {
    max-width: unset;
    padding-right: 12vw;
    margin-bottom: toRem(152);
  }
  @include mini {
    padding-right: 0;
  }
  &:first-child {
    margin-top: toRem(130);
    @include small {
      margin-top: toRem(260);
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
      transform: scale(1.05);
      @include small {
        transform: scale(1.1) translateY(-14px);
      }
    }
    .links {
      opacity: 1;
    }
  }
}

.image {
  width: toRem(210);
  height: toRem(210);
  margin-bottom: 0.75rem;
  transition: transform 300ms ease;
  @include medium {
    width: toRem(180);
    height: toRem(180);
  }
  @include small {
    width: toRem(310);
    height: toRem(310);
  }
  @include mini {
    width: toRem(210);
    height: toRem(210);
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
}

.links {
  display: flex;
  justify-content: center;
  opacity: 0;
  transition: 350ms ease;
  &.mobile-only {
    justify-content: flex-start;
    padding: 1rem 0;
  }
}

.release-link {
  color: white;
  padding: 0;
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
}
</style>