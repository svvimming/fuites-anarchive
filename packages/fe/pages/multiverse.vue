<template>
  <div class="multiverse">
    <!-- =========================================== Create New Verse Button -->
    <ButtonDashed
      text="create verse"
      :active="createVerseButtonActive"
      class="new-verse-button"
      @clicked="handleCreateNewVerseClick">
      <template #icon-after>
        <IconAdd class="icon" />
      </template>
    </ButtonDashed>
    <!-- ================================================ Enter Token Button -->
    <ButtonDashed
      text="enter token"  
      :active="enterTokenButtonActive"
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
    <div class="verses">
      <ClientOnly>
        <MultiversePortal
          v-for="(verse, index) in verses"
          :key="verse._id"
          :verse="verse"
          :to="getVersePageRoute(verse)"
          :label-radius="positionData[index]?.labelRadius"
          :label-angle="positionData[index]?.labelAngle"
          :style="positionData[index]"
          @open-verse-settings="setSettingsModalVerseId" />
      </ClientOnly>
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
const createVerseButtonActive = ref(false)
const enterTokenButtonActive = ref(false)
const positionData = ref([])
const settingsModalVerseId = ref(false)
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
const verses = computed(() => pocket.value.data?.verses || [])

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
  const length = verses.value.length
  const intervalX = window.innerWidth / length
  const intervalY = window.innerHeight * 0.5
  positionData.value = Array.from({ length }, (_, index) => ({
    left: `${(intervalX * index + Math.random() * intervalX * 0.4)}px`,
    top: `${(intervalY * Math.sin(index) + Math.random() * intervalY * 0.3) + intervalY * 0.25}px`,
    labelRadius: intervalY * 0.25,
    labelAngle: -90 * Math.random() - 45
  }))
}

const setSettingsModalVerseId = verseId => {
  settingsModalVerseId.value = verseId
}

// ======================================================================= Hooks
onMounted(() => {
  nextTick(() => {
    calculatePortalPositions()
  })
})
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.multiverse {
  position: relative;
  width: 100%;
  height: 100%;
}

.new-verse-button {
  position: absolute;
  bottom: torem(20);
  left: torem(20);
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
</style>
