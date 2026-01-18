<template>
  <div class="pluriverse-verse-nav">
    <!-- ======================================================== Background -->
    <div class="background-panel">
      <div
        v-for="item in backgroundVerses"
        :key="item.color"
        class="background-verse"
        :style="{
          transform: `translate(${item.rx * viewportDimensions.width}px, ${item.ry * viewportDimensions.height}px)`,
          backgroundColor: item.color,
          opacity: item.opacity
        }" />
    </div>
    <!-- ============================================================ Verses -->
    <div
      class="grid-noBottom-noGutter full no-padding">
      <div
        class="col-2_ulg-3_xlg-4_md-5_sm-8_mi-10_ti-12"
        data-push-left="off-0_sm-2_mi-1_ti-0"
        data-push-right="off-1_sm-2_mi-1_ti-0">
        <!-- ------------------------------------------------------ Site Nav -->
        <div
          v-show="pocketAuth"
          class="logo-container">
          <SiteLogo v-once />
        </div>
        <ButtonBasic
          v-if="pocketAuth"
          theme="clear"
          class="info-button"
          @clicked="toggleInfoModal">
          Info
        </ButtonBasic>
        <!-- ----------------------------------------------------- Verse Nav -->
        <template v-if="pocketAuth">

          <div class="verse-list-header">
            <div class="list-heading">
              Your Verses
            </div>
            <Searchbar
              placeholder="Search for a verse"
              class="verse-search"
              @value-updated="handleSearch" />
          </div>

          <div
            class="verse-list"
            @mouseleave="hovered = false">

            <div
              v-for="verse in filteredVerses"
              :key="`${verse._id}-nav-item`"
              class="verse-nav-item"
              @mouseenter="hovered = verse._id">
              <ButtonBasic
                tag="nuxt-link"
                theme="clear"
                :to="getVersePageRoute(verse)"
                class="to-verse-button">
                <span class="verse-name">
                  {{ verse.name }}
                </span>
                <IconArrowRight class="icon-arrow-right" />
              </ButtonBasic>
              
              <ButtonIcon
                v-if="pocketAuth"
                class="verse-settings-button"
                @clicked="emit('open-verse-settings', verse._id)">
                <IconEllipsis class="icon-ellipsis" />
              </ButtonIcon>
            </div>

            <div
              v-if="filteredVerses.length === 0"
              class="no-results">
              No Verses match your search!
            </div>

          </div>

        </template>
      </div>
      <!-- ----------------------------------------- Pluriverse Visual Right -->
      <div class="col-9_ulg-8_xlg-7_md-6_sm-hidden">
        <div ref="versesCtnRef" class="verse-portals">
          <template v-for="(verse, index) in verses">
            <PluriversePortal
              v-if="verse._id"
              :key="`${verse._id}-portal`"
              :verse="verse"
              :active="hovered === verse._id"
              :style="{ transform: `translate(${positionData[index]?.x}px, ${positionData[index]?.y}px)` }" />
          </template>
        </div>
      </div>

    </div>
    
  </div>
</template>

<script setup>
// ======================================================================= Setup
const props = defineProps({
  verses: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['open-verse-settings'])

// ======================================================================== Data
const alertStore = useZeroAlertStore()
const pocketStore = usePocketStore()
const { pocketAuth } = storeToRefs(pocketStore)
const positionData = ref([])
const versesCtnRef = ref(null)
const randomOffsets = ref([])
const resizeEventListener = ref(null)
const viewportDimensions = ref({ width: 0, height: 0 })
const hovered = ref(false)
const searchTerm = ref('')

const backgroundVerses = [
  { color: '#73E575', opacity: Math.random() * 0.25 + 0.5, rx: Math.random(), ry: Math.random() },
  { color: '#D14CA9', opacity: Math.random() * 0.25 + 0.5, rx: Math.random(), ry: Math.random() },
  { color: '#D1CB4C', opacity: Math.random() * 0.25 + 0.5, rx: Math.random(), ry: Math.random() },
  { color: '#E573C3', opacity: Math.random() * 0.25 + 0.5, rx: Math.random(), ry: Math.random() },
  { color: '#45674A', opacity: Math.random() * 0.25 + 0.5, rx: Math.random(), ry: Math.random() },
  { color: '#73E5D8', opacity: Math.random() * 0.25 + 0.5, rx: Math.random(), ry: Math.random() },
  { color: '#E57373', opacity: Math.random() * 0.25 + 0.5, rx: Math.random(), ry: Math.random() }
]

// ==================================================================== Computed
const filteredVerses = computed(() => {
  if (searchTerm.value === '') { return props.verses }
  return props.verses.filter(verse => verse.name.toLowerCase().includes(searchTerm.value.toLowerCase()))
})

// ==================================================================== Watchers
watch(() => props.verses.length, () => {
  nextTick(() => {
    generateRandomOffsets()
    calculatePortalPositions()
  })
})

// ===================================================================== Methods
const getVersePageRoute = verse => {
  const page = verse.page_refs.find(item => item.name !== 'compost')
  return `/${verse.name}/${page.name}`
}

const calculatePortalPositions = () => {
  positionData.value = Array.from({ length: props.verses.length }, (_, index) => getPortalPosition(index))
}

const generateRandomOffsets = () => {
  randomOffsets.value = Array.from({ length: props.verses.length }, () => ({
    x: Math.random(),
    y: Math.random() - 0.5
  }))
}

const getPortalPosition = index => {
  // Get the viewport width and height (for bg)
  viewportDimensions.value = { width: window.innerWidth, height: window.innerHeight }
  // Get the width and height of the verses container
  const width = (versesCtnRef.value?.clientWidth || 0) * 0.75
  const height = viewportDimensions.value.height * 0.75
  // Return randomized position
  return {
    x: width * randomOffsets.value[index].x,
    y: height * randomOffsets.value[index].y
  }
}

const toggleInfoModal = () => {
  const alert = alertStore.getAlert('pluriverse-info-modal')
  if (alert) {
    alertStore.openAlert('pluriverse-info-modal')
  }
}

const handleSearch = (term) => {
  searchTerm.value = term
}

// ======================================================================= Hooks
onMounted(() => {
  if (process.client) {
    nextTick(() => {
      // Generate random offsets for the portals
      generateRandomOffsets()
      // Add a resize event listener to the window
      resizeEventListener.value = () => { calculatePortalPositions() }
      window.addEventListener('resize', resizeEventListener.value)
      // Calculate the positions of the portals
      setTimeout(() => {
        calculatePortalPositions()
      }, 100)
    })
  }
})

onBeforeUnmount(() => {
  // Remove the resize event listener from the window
  if (resizeEventListener.value) {
    window.removeEventListener('resize', resizeEventListener.value)
  }
})

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.pluriverse-verse-nav {
  height: 100%;
  [class~="grid"],
  [class*="grid-"],
  [class*="grid_"] {
    position: relative;
    height: 100%;
    z-index: 2;
  }
}

.background-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.background-verse {
  position: absolute;
  top: 0;
  left: 0;
  width: torem(26);
  height: torem(26);
  border-radius: 50%;
  filter: blur(torem(16));
}

// //////////////////////////////////////////////////////////////////// Site Nav
.logo-container {
  position: relative;
  padding-top: torem(20);
  padding-left: torem(20);
  z-index: 3;
  :deep(.letter) {
    color: $drippyCore;
  }
}

.info-button {
  margin-left: torem(28);
  margin-bottom: torem(12);
  :deep(.slot) {
    color: $drippyCore !important;
  }
}

.logo-container,
.info-button {
  @include small {
    transform: translateX(torem(-24));
  }
  @include tiny {
    transform: none;
  }
}

// /////////////////////////////////////////////////////////////////// Verse Nav
.verse-list-header {
  padding: torem(60) 0 torem(4) torem(10);
  @include small {
    padding: torem(60) 0 torem(4) 0;
  }
}

.list-heading {
  margin-left: torem(12);
  margin-bottom: torem(6);
  font-size: torem(18);
  font-weight: 500;
  color: $drippyCore;
}

.verse-search {
  width: 100%;
  @include tiny {
    padding: 0 torem(8);
    &:after {
      right: torem(20);
    }
  }
}

.verse-list {
  max-height: 50vh;
  overflow-y: scroll;
  padding-right: torem(30);
  margin-right: torem(-30);
  @include small {
    padding-right: 0;
    margin-right: 0;
  }
}

// .verse-list-header,
// .verse-list {
//   padding-left: torem(20);
// }

.verse-nav-item {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  padding: torem(8) 0;
  padding-right: torem(16);
  border-top-right-radius: torem(4);
  border-bottom-right-radius: torem(4);
  transition: background-color 200ms ease-in-out;
  @include small {
    border-radius: torem(4);
  }
  &:hover {
    background-color: $drippyCore;
    :deep(.slot) {
      color: white;
    }
    .icon-arrow-right {
      opacity: 1;
    }
  }
}

.to-verse-button {
  display: flex;
  flex-grow: 1;
  margin-right: torem(16);
  padding-left: torem(35);
  @include small {
    padding-left: torem(25);
  }
  .verse-name {
    margin-right: torem(8);
  }
  .icon-arrow-right {
    width: torem(10);
    height: torem(10);
    opacity: 0;
    transition: opacity 200ms ease-in-out;
    transform: rotate(-45deg);
    :deep(path) {
      stroke: white;
    }
  }
}

.verse-portals {
  position: relative;
  height: 100%;
  z-index: 1;
}

.verse-settings-button {
  width: torem(30);
  height: torem(30);
}

.no-results {
  padding: torem(16);
  text-align: center;
  font-size: torem(13);
  font-weight: 400;
  color: $drippyCore;
}
</style>
