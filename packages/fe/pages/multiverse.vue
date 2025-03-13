<template>
  <div class="multiverse">
    <!-- =========================================== Create New Verse Button -->
    <ButtonDashed
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
      :stylized="enterTokenButtonText"
      :active="enterTokenButtonActive"
      :flat-dashes="4"
      class="enter-token-button"
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
      :verse-id="settingsModalVerseId"
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
await useAsyncData('multiverse', async () => await verseStore.getVerse({ verse: 'fog' }), { server: false })

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
const enterTokenButtonText = [
  { letter: 'e', classes: 'source-serif-pro semibold italic' },
  { letter: 'n', classes: 'source-sans-pro bold' },
  { letter: 't', classes: 'source-serif-pro semibold italic' },
  { letter: 'e', classes: 'source-sans-pro bold italic' },
  { letter: 'r', classes: 'source-serif-pro semibold' },
  { letter: ' ', classes: '' },
  { letter: 't', classes: 'source-serif-pro italic bold' },
  { letter: 'o', classes: 'source-serif-pro semibold italic' },
  { letter: 'k', classes: 'source-sans-pro bold' },
  { letter: 'e', classes: 'source-serif-pro semibold italic' },
  { letter: 'n', classes: 'source-sans-pro bold italic' }
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
  return `/verse/${verse._id}/${page.name}`
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
//   const length = verses.value.length
//   const intervalX = window.innerWidth / length
//   const intervalY = window.innerHeight * 0.5
//   positionData.value = Array.from({ length }, (_, index) => ({
//     left: `${(intervalX * index + Math.random() * intervalX * 0.4)}px`,
//     top: `${(intervalY * Math.sin(index) + Math.random() * intervalY * 0.3) + intervalY * 0.25}px`,
//     labelRadius: intervalY * 0.25,
//     labelAngle: -90 * Math.random() - 45
//   }))
// }

const getPortalPosition = index => {
  const length = verses.value.length
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
  settingsModalVerseId.value = verseId
}

// ======================================================================= Hooks
onMounted(() => {
  generateRandomOffsets()
  calculatePortalPositions()
  if (process.client) {
    resizeEventListener.value = () => { calculatePortalPositions() }
    window.addEventListener('resize', resizeEventListener.value)
  }
})

onBeforeUnmount(() => {
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

.new-verse-button {
  position: absolute;
  bottom: torem(20);
  left: torem(20);
  --two-tone-a: #{$drippyCore};
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

.enter-token-button {
  position: absolute;
  bottom: torem(20);
  right: torem(20);
  --two-tone-a: #{$billyBlue};
}

.icon {
  width: torem(16);
  height: torem(16);
  margin-left: torem(10);
}

.verses {
  position: relative;
  height: 100%;
}
</style>
