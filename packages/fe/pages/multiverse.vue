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
    <MultiverseCreateVerseAlert />

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

const getVersePageRoute = verse => {
  const page = verse.page_refs.find(item => item.name !== 'compost')
  return `/verse/${verse._id}/${page.name}`
}
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
