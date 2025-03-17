<template>
  <div class="multiverse">
    <!-- ======================================================== Background -->
    <div class="background-panel">
      <ClientOnly>
        <div
          v-for="item in backgroundVerses"
          :key="item.color"
          class="background-verse"
          :style="{
            transform: `translate(${item.rx * viewportDimensions.width}px, ${item.ry * viewportDimensions.height}px)`,
            backgroundColor: item.color,
            opacity: item.opacity
          }" />
      </ClientOnly>
    </div>
    <!-- ======================================================= Landing Nav -->
    <LandingNav v-show="!authenticated" />
    <!-- ========================================================= Site Logo -->
    <div
      v-show="authenticated"
      class="logo-container">
      <SiteLogo v-once />
    </div>
    <!-- ======================================================= Info Button -->
    <ButtonBasic
      v-if="authenticated"
      theme="clear"
      class="info-button"
      @clicked="toggleInfoModal">
      Info
    </ButtonBasic>
    <!-- ======================================================== Info Modal -->
    <MultiverseInfoModal :markdown="infoMarkdown[0]" />
    <!-- =========================================== Create New Verse Button -->
    <ButtonDashed
      v-if="authenticated"
      :stylized="createVerseButtonText"
      :active="createVerseButtonActive"
      :flat-dashes="4"
      class="new-verse-button"
      @clicked="handleCreateNewVerseClick">
      <template #icon-after>
        <IconPlus class="icon" />
      </template>
    </ButtonDashed>
    <!-- ================================================ Enter Token Button -->
    <ButtonDashed
      v-if="authenticated"
      :stylized="changeTokenButtonText"
      :active="enterTokenButtonActive"
      :flat-dashes="4"
      class="change-token-button"
      @clicked="handleEnterTokenClick">
      <template #icon-after>
        <IconKey class="icon" />
      </template>
    </ButtonDashed>
    <!-- ======================================================== Token Auth -->
    <ZeroAlert mode="alert" alert-id="multiverse-auth-alert">
      <Auth
        heading="Token"
        message="Enter a token to access your Verses:"
        @authenticate-success="handleCloseAuthAlert"
        @cancel-authentication="handleCloseAuthAlert" />
    </ZeroAlert>
    <!-- ================================================ Create Verse Alert -->
    <MultiverseCreateVerseAlert
      @close-alert="handleCloseCreateVerseAlert" />
    <!-- ============================================================ Verses -->
    <div class="grid-noBottom-noPadding">
      <div class="col">
        <div ref="versesCtnRef" class="verses">
          <ClientOnly>
            <template v-for="(verse, index) in verses">
              <MultiversePortal
                v-if="verse._id"
                :key="verse._id"
                :verse="verse"
                :to="getVersePageRoute(verse)"
                :style="{ transform: `translate(${positionData[index]?.x}px, ${positionData[index]?.y}px)` }"
                @open-verse-settings="setSettingsModalVerseId" />
            </template>
          </ClientOnly>
        </div>
      </div>
    </div>
    <!-- ============================================== Verse Settings Modal -->
    <MultiverseVerseSettingsModal
      :verse="editingVerse"
      @close-alert="setSettingsModalVerseId(false)" />

  </div>
</template>

<script setup>
// ======================================================================= Setup
import SettingsData from '@/data/settings.json'

definePageMeta({ layout: 'multiverse' })

// ======================================================================== Data
const generalStore = useGeneralStore()
const alertStore = useZeroAlertStore()
const pocketStore = usePocketStore()
const { pocket, authenticated } = storeToRefs(pocketStore)
const verseStore = useVerseStore()
const { verse } = storeToRefs(verseStore)
const createVerseButtonActive = ref(false)
const enterTokenButtonActive = ref(false)
const positionData = ref([])
const settingsModalVerseId = ref(false)
const versesCtnRef = ref(null)
const randomOffsets = ref([])
const resizeEventListener = ref(null)
const viewportDimensions = ref({ width: 0, height: 0 })

// fetch Verse
await useAsyncData('multiverse', async () => await verseStore.getVerse({ verse: 'fog' }), { server: false })
// fetch Info Modal Markdown
const { data: infoMarkdown } = await useAsyncData('info-modal-data', async () => await queryContent().where({ _path: '/data/info' }).find())

const createVerseButtonText = [
  { letter: 'c', classes: 'source-serif-pro semibold italic' },
  { letter: 'r', classes: 'source-sans-pro bold' },
  { letter: 'e', classes: 'source-serif-pro semibold italic' },
  { letter: 'a', classes: 'source-sans-pro bold italic' },
  { letter: 't', classes: 'source-serif-pro semibold' },
  { letter: 'e', classes: 'source-serif-pro semibold italic' },
  { letter: ' ', classes: '' },
  { letter: 'v', classes: 'source-sans-pro bold italic' },
  { letter: 'e', classes: 'source-serif-pro semibold italic' },
  { letter: 'r', classes: 'source-sans-pro bold italic' },
  { letter: 's', classes: 'source-serif-pro semibold' },
  { letter: 'e', classes: 'source-serif-pro semibold italic' } 
]
const changeTokenButtonText = [
  { letter: 'c', classes: 'source-serif-pro semibold italic' },
  { letter: 'h', classes: 'source-sans-pro bold' },
  { letter: 'a', classes: 'source-serif-pro semibold italic' },
  { letter: 'n', classes: 'source-sans-pro bold italic' },
  { letter: 'g', classes: 'source-serif-pro semibold' },
  { letter: 'e', classes: 'source-serif-pro semibold italic' },
  { letter: ' ', classes: '' },
  { letter: 't', classes: 'source-serif-pro italic bold' },
  { letter: 'o', classes: 'source-serif-pro semibold italic' },
  { letter: 'k', classes: 'source-sans-pro bold' },
  { letter: 'e', classes: 'source-serif-pro semibold italic' },
  { letter: 'n', classes: 'source-sans-pro bold italic' }
]
const backgroundVerses = [
  { color: '#73E575', opacity: Math.random() * 0.25 + 0.5, rx: Math.random(), ry: Math.random() },
  { color: '#D14CA9', opacity: Math.random() * 0.25 + 0.5, rx: Math.random(), ry: Math.random() },
  { color: '#D1CB4C', opacity: Math.random() * 0.25 + 0.5, rx: Math.random(), ry: Math.random() },
  { color: '#E573C3', opacity: Math.random() * 0.25 + 0.5, rx: Math.random(), ry: Math.random() },
  { color: '#45674A', opacity: Math.random() * 0.25 + 0.5, rx: Math.random(), ry: Math.random() },
  { color: '#73E5D8', opacity: Math.random() * 0.25 + 0.5, rx: Math.random(), ry: Math.random() },
  { color: '#E57373', opacity: Math.random() * 0.25 + 0.5, rx: Math.random(), ry: Math.random() }
]

// Set site data
await generalStore.setSiteData({ key: 'settings', value: SettingsData })
// Check local storage for auth token and try to authenticate if found
if (process.client) {
  const localStorageAuthToken = localStorage.getItem('fuitesAnarchiveAuthToken')
  if (!authenticated.value && localStorageAuthToken) {
    await pocketStore.getAuthPocket({ token: localStorageAuthToken, localStorageAuth: true })
  }
}

// ==================================================================== Computed
const verses = computed(() => pocket.value.data.verses.length ? pocket.value.data.verses : [verse.value.data])
const editingVerse = computed(() => verses.value.find(item => item._id === settingsModalVerseId.value) || null)
// const verses = computed(() => Array.from({ length: 10 }, (_, index) => index))
// ==================================================================== Watchers
watch(() => verses.value.length, () => {
  nextTick(() => {
    generateRandomOffsets()
    calculatePortalPositions()
  })
})

// ===================================================================== Methods
const handleCreateNewVerseClick = () => {
  const alert = alertStore.getAlert('multiverse-create-verse-alert')
  if (alert.status === 'closed') {
    alertStore.openAlert('multiverse-create-verse-alert')
    createVerseButtonActive.value = true
  } else {
    alertStore.closeAlert('multiverse-create-verse-alert')
    createVerseButtonActive.value = false
  }
  if (alertStore.getAlert('multiverse-auth-alert').status === 'open') {
    alertStore.closeAlert('multiverse-auth-alert')
    enterTokenButtonActive.value = false
  }
  settingsModalVerseId.value = false
}

const handleEnterTokenClick = () => {
  const alert = alertStore.getAlert('multiverse-auth-alert')
  if (alert.status === 'closed') {
    alertStore.openAlert('multiverse-auth-alert')
    enterTokenButtonActive.value = true
  } else {
    alertStore.closeAlert('multiverse-auth-alert')
    enterTokenButtonActive.value = false
  }
  if (alertStore.getAlert('multiverse-create-verse-alert').status === 'open') {
    alertStore.closeAlert('multiverse-create-verse-alert')
    createVerseButtonActive.value = false
  }
  settingsModalVerseId.value = false
}

const handleCloseAuthAlert = () => {
  alertStore.closeAlert('multiverse-auth-alert')
  enterTokenButtonActive.value = false
}

const handleCloseCreateVerseAlert = () => {
  alertStore.closeAlert('multiverse-create-verse-alert')
  createVerseButtonActive.value = false
}

const getVersePageRoute = verse => {
  const page = verse.page_refs.find(item => item.name !== 'compost')
  return `/${verse.name}/${page.name}`
}

const calculatePortalPositions = () => {
  positionData.value = Array.from({ length: verses.value.length }, (_, index) => getPortalPosition(index))
}

const generateRandomOffsets = () => {
  randomOffsets.value = Array.from({ length: verses.value.length }, () => ({
    x: Math.random() - 0.5,
    y: Math.random() - 0.5
  }))
}

const getPortalPosition = index => {
  // Get the viewport width and height (for bg)
  viewportDimensions.value = { width: window.innerWidth, height: window.innerHeight }
  // Get the length of the verses
  const length = verses.value.length
  // Get the width of the verses container
  const width = versesCtnRef.value?.clientWidth || 0
  // Scale index to fit one sine period (2π)
  const scaledIndex = (index / length) * 2 * Math.PI
  // Calculate x scale based on viewport width
  const xScale = width / length
  // Scale factors for amplitude
  const yAmplitude = versesCtnRef.value?.clientHeight * 0.25 || 100
  return {
    x: (index * xScale + (xScale / 2)) + randomOffsets.value[index].x * (xScale * 0.4),
    y: (Math.sin(scaledIndex) * yAmplitude) + randomOffsets.value[index].y * (yAmplitude * 0.4)
  }
}

const setSettingsModalVerseId = verseId => {
  // Set the verse id for the verse settings modal
  settingsModalVerseId.value = verseId
  // Close any open alerts when a verse settings modal is opened
  if (alertStore.getAlert('multiverse-auth-alert').status === 'open') {
    alertStore.closeAlert('multiverse-auth-alert')
    enterTokenButtonActive.value = false
  }
  if (alertStore.getAlert('multiverse-create-verse-alert').status === 'open') {
    alertStore.closeAlert('multiverse-create-verse-alert')
    createVerseButtonActive.value = false
  }
}

const toggleInfoModal = () => {
  alertStore.openAlert('multiverse-info-modal')
}

// ======================================================================= Hooks
onMounted(() => {
  if (process.client) {
    // Generate random offsets for the portals
    generateRandomOffsets()
    // Calculate the positions of the portals
    calculatePortalPositions()
    // Add a resize event listener to the window
    resizeEventListener.value = () => { calculatePortalPositions() }
    window.addEventListener('resize', resizeEventListener.value)
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
.multiverse {
  position: relative;
  width: 100%;
  height: 100%;
  [class~="grid"],
  [class*="grid-"],
  [class*="grid_"] {
    height: 100%;
  }
}

.background-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
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

.logo-container {
  position: absolute;
  top: torem(20);
  left: torem(20);
  z-index: 2;
  :deep(.letter) {
    color: $drippyCore;
  }
}

.info-button {
  position: absolute;
  top: torem(20);
  right: torem(20);
  z-index: 2;
  :deep(.slot) {
    color: $drippyCore !important;
  }
}

.new-verse-button {
  position: absolute;
  bottom: torem(20);
  left: torem(20);
  --two-tone-a: #{$drippyCore};
  z-index: 2;
  :deep(.icon) {
    path {
      fill: rgb(131, 147, 192);
    }
  }
  &.active {
    :deep(.icon) {
      rect { fill: white; }
    }
  }
}

.change-token-button {
  position: absolute;
  bottom: torem(20);
  right: torem(20);
  --two-tone-a: #{$billyBlue};
  z-index: 2;
}

.icon {
  width: torem(16);
  height: torem(16);
  margin-left: torem(5);
}

.verses {
  position: relative;
  height: 100%;
  z-index: 1;
}
</style>
