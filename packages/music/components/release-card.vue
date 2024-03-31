<template>
  <div class="release">

    <nuxt-link :to="portal.to">
      <div
        class="image"
        @mouseover="$emit('over-release', name)">
        <img :src="image" :alt="`${name}-album-artwork`" />
      </div>
    </nuxt-link>

    <div class="links">
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
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.release {
  max-width: toRem(210);
  margin-bottom: toRem(52);
  transform: scale(1);
  transition: 250ms ease;
  &:first-child {
    margin-top: toRem(130);
  }
  &.active {
    transform: scale(1.05);
    .links {
      opacity: 1;
    }
  }
}

.image {
  width: toRem(210);
  height: toRem(210);
  margin-bottom: 0.75rem;
  img {
    width: 100%;
    height: 100%;
  }
}

.links {
  display: flex;
  justify-content: center;
  opacity: 0;
  transition: 350ms ease;
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