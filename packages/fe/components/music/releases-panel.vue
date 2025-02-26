<template>
  <div :class="['releases-content', { 'high-z': visible }]">
    <div class="grid-noGutter full full-height">

      <div 
        class="col-5_sm-hidden">
        <div
          v-if="selected"
          :class="['selected-release', { visible }]">

          <div class="name">
            {{ selected.name }}
          </div>

          <div class="artist">
            {{ selected.artist }}
          </div>

          <div
            class="description"
            v-html="selected.description">
          </div>

        </div>
      </div>

      <div
        class="col-5_md-6_sm-12"
        data-push-left="off-2_md-1_sm-0">
        <div :class="['releases-panel', { visible }]">

          <button
            id="close-releases"
            class="button"
            @click="emit('close-releases')">
            close
          </button>

          <div class="grid-noGutter-noBottom">
            <div
              class="col-6_mi-8"
              data-push-left="off-2_md-3_mi-2">
              <div class="release-list">
                <MusicReleaseCard
                  v-for="release in releases"
                  :key="release.slug"
                  :card="release"
                  :active="release.slug === selectedRelease"
                  :mobile="mobile"
                  @over-release="setSelectedRelease" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// ======================================================================= Setup
const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
    default: false
  },
  releases: {
    type: Array,
    required: true,
    default: () => []
  },
  defaultRelease: {
    type: String,
    required: false,
    default: ''
  }
})

const emit = defineEmits(['close-releases'])

// ======================================================================== Data
const router = useRouter()
const route = useRoute()
const selectedRelease = ref('')
const resize = ref(false)
const mobile = ref(false)

// ==================================================================== Computed
const selected = computed(() => props.releases.find(item => item.slug === selectedRelease.value))

// ==================================================================== Watchers
watch(() => props.visible, (val) => {
  if (val && props.defaultRelease) {
    setSelectedRelease(props.defaultRelease)
  } else {
    if (route.query.release) {
      router.push({ query: null })
    }
  }
})

// ======================================================================= Hooks
onMounted(() => {
  if (props.defaultRelease) {
    setSelectedRelease(props.defaultRelease)
  } else {
    selectedRelease.value = props.releases[0].slug
  }
  resize.value = () => { checkSmallBreakpoint() }
  window.addEventListener('resize', resize.value)
  checkSmallBreakpoint()
})

onBeforeUnmount(() => {
  if (resize.value) {
    window.removeEventListener('resize', resize.value)
  }
})

// ===================================================================== Methods
const setSelectedRelease = incoming => {
  selectedRelease.value = incoming
  router.push({ query: { release: useSlugify(incoming) } })
}

const checkSmallBreakpoint = () => {
  if (window.matchMedia('(max-width: 53.125rem)').matches) {
    if (!mobile.value) {
      mobile.value = true
    }
  } else {
    if (mobile.value) {
      mobile.value = false
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.releases-content {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
  &.high-z {
    z-index: 10;
  }
}

.full-height {
  height: 100%;
}

.release-list {
  @include small {
    padding-top: torem(150);
    padding-bottom: torem(150);
  }
  @include mini {
    padding-top: 0;
  }
}

.selected-release {
  margin-top: torem(313);
  padding-left: calc(torem(90) - 0.5rem);
  padding-right: torem(0);
  @include medium {
    margin-top: torem(253);
    padding-left: calc(torem(60) - 0.5rem);
    padding-right: 0;
  }
  @include small {
    padding-left: calc(torem(30) - 0.5rem);
  }
}

.name,
.artist,
.description {
  color: white;
  font-family: 'PT Sans', sans-serif;
  letter-spacing: 0.02em;
}

.name {
  margin-bottom: torem(12);
  font-weight: 500;
  font-size: torem(20);
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

.selected-release,
.releases-panel {
  visibility: hidden;
  transition: 500ms ease 300ms;
  opacity: 0;
  &.visible {
    visibility: visible;
    opacity: 1;
  }
}

.releases-panel {
  max-height: 100vh;
  overflow: scroll;
  -ms-overflow-style: none;  /* Internet Explorer 10+ */
  scrollbar-width: none;  /* Firefox */
  &:-webkit-scrollbar { 
      display: none;  /* Safari and Chrome */
  }
  @include small {
    min-height: torem(1080);
  }
}

#close-releases {
  position: absolute;
  font-weight: 500;
  top: torem(48);
  right: 1.5rem;
  padding: 1rem;
  @include large {
    right: 1rem;
  }
  @include small {
    bottom: unset;
    top: torem(16);
    right: 0.75rem;
  }
  @include tiny {
    right: 0rem;
  }
  &:hover {
    letter-spacing: 4px;
  }
}

</style>
