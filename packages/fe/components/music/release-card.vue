<template>
  <div :class="['release', { active }]">

    <div
      class="image"
      @mouseover="emit('over-release', slug)"
      @click="emit('over-release', slug)">
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
          <ButtonBasic
            v-for="link in links"
            :key="link.text"
            :force-disabled="link.disabled"
            :tag="link.tag"
            :to="link.to"
            :target="link.target"
            theme="clear"
            class="release-link">
            {{ link.text }}
          </ButtonBasic>
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
      <ButtonBasic
        v-for="link in links"
        :key="link.text"
        :force-disabled="link.disabled"
        :tag="link.tag"
        :to="link.to"
        :target="link.target"
        theme="clear"
        class="release-link">
        {{ link.text }}
      </ButtonBasic>
    </div>

  </div>
</template>

<script setup>
// ======================================================================= Setup
const props = defineProps({
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
})

const emit = defineEmits(['over-release'])

// ======================================================================== Data
const content = ref(null)
const infoHeight = ref(0)

// ==================================================================== Computed
const image = computed(() => props.card.img)
const links = computed(() => props.card.links)
const slug = computed(() => props.card.slug)
const name = computed(() => props.card.name)
// const portal = computed(() => links.value.find(item => item.tag === 'nuxt-link'))
const artist = computed(() => props.card.artist)
const description = computed(() => props.card.description)

// ==================================================================== Watchers
watch(() => props.active, () => {
  nextTick(() => {
    const height = getInfoHeight()
    if (infoHeight.value !== height) { infoHeight.value = height }
  })
})

// ======================================================================= Hooks
onMounted (() => {
  nextTick(() => {
    infoHeight.value = getInfoHeight()
  })
})

// ===================================================================== Methods
const getInfoHeight = () => {
  if (props.mobile && props.active && content.value) {
    return content.value.offsetHeight
  }
  return 0
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.release {
  width: torem(200);
  margin-bottom: torem(52);
  @include small {
    width: unset;
    margin-bottom: torem(152);
  }
  @include mini {
    padding-right: 0;
  }
  &:first-child {
    margin-top: torem(130);
    @include small {
      margin-top: calc(50vh - 32.5vw - 5rem);
    }
  }
  &:last-child {
    margin-bottom: torem(130);
    @include small {
      margin-bottom: torem(300);
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
  width: torem(120);
  height: torem(120);
  margin: torem(40);
  transition: transform 400ms ease;
  box-shadow: 4px 4px 14px rgba(0, 0, 0, 0.5);
  @include small {
    width: 100%;
    height: unset;
    margin: unset;
    margin-bottom: torem(48);
  }
  @include mini {
    margin-bottom: torem(32);
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
  font-family: 'Source Sans Pro', sans-serif;
  letter-spacing: 0.02em;
}

.name {
  padding-top: 0.5rem;
  margin-bottom: torem(12);
  font-weight: 500;
  font-size: torem(18);
}

.artist {
  font-family: 'Fraunces Italic', serif;
  margin-bottom: torem(28);
}

.description {
  line-height: 1.6;
  font-weight: 400;
  font-size: torem(13);
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
  letter-spacing: torem(1);
  &:not(:last-child) {
    margin-right: 1rem;
  }
  // font-family: 'Source Sans Pro', sans-serif ;
  :deep(.slot) {
    color: white !important;
    font-family: 'Source Sans Pro', sans-serif !important;
    font-size: torem(14);
  }
  :deep(.tripe-dot-loader) {
    display: none;
  }
  &:hover {
    font-weight: 700;
    letter-spacing: torem(1.5);
  }
}
</style>
