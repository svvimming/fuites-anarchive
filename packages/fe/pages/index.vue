<template>
  <div class="multiverse">
    <!-- ======================================================= Landing Nav -->
    <LandingNav v-show="!pocketAuth" />
    <!-- ======================================================== Info Modal -->
    <MultiverseInfoModal v-if="infoMarkdown" :markdown="infoMarkdown" />
    <!-- =========================================== Create New Verse Button -->
    <ClientOnly>
      <ButtonDashed
        v-if="pocketAuth"
        :stylized="createVerseButtonText"
        :active="createVerseButtonActive"
        :flat-dashes="4"
        class="new-verse-button"
        @clicked="handleCreateNewVerseClick">
        <template #icon-after>
          <IconPlus class="icon" />
        </template>
      </ButtonDashed>
    </ClientOnly>
    <!-- ================================================ Enter Token Button -->
    <ClientOnly>
      <ButtonDashed
        v-if="pocketAuth"
        :stylized="changeTokenButtonText"
        :active="enterTokenButtonActive"
        :flat-dashes="4"
        class="change-token-button"
        @clicked="handleEnterTokenClick">
        <template #icon-after>
          <IconKey class="icon" />
        </template>
      </ButtonDashed>
    </ClientOnly>
    <!-- =============================================== Community and Terms -->
    <div class="community-and-terms">
      <ButtonBasic
        theme="clear"
        tag="nuxt-link"
        :to="'/community-guidelines'"
        class="community-button">
        Community Guidelines
      </ButtonBasic>
      <span class="separator">|</span>
      <ButtonBasic
        theme="clear"
        tag="nuxt-link"
        :to="'/terms-of-use'"
        class="community-button">
        Terms of Use
      </ButtonBasic>
    </div>

    <!-- ======================================================== Token Auth -->
    <ZeroAlert
      mode="alert"
      alert-id="multiverse-auth-alert"
      class="multiverse-auth-alert">
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
    <ClientOnly>
      <MultiverseVerseNav
        :verses="verses"
        @open-verse-settings="setSettingsModalVerseId" />
    </ClientOnly>
    <!-- ============================================== Verse Settings Modal -->
    <MultiverseVerseSettingsModal
      :verse="editingVerse"
      class="verse-settings-modal-wrapper"
      @close-alert="setSettingsModalVerseId(false)" />
    <!-- ===================================================== FTU FYI Blurb -->
    <FtuFyiBlurb class="ftu-fyi-alert" />

  </div>
</template>

<script setup>
// ======================================================================= Setup
import SettingsData from '@/data/settings.json'
// import InfoMarkdown from '@/content/info.md'

definePageMeta({ layout: 'multiverse' })

// ======================================================================== Data
const generalStore = useGeneralStore()
const alertStore = useZeroAlertStore()
const pocketStore = usePocketStore()
const { pocket, pocketAuth } = storeToRefs(pocketStore)
const verseStore = useVerseStore()
const { verse } = storeToRefs(verseStore)
const createVerseButtonActive = ref(false)
const enterTokenButtonActive = ref(false)
const settingsModalVerseId = ref(false)

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

// fetch Verse
await useAsyncData('multiverse', async () => await verseStore.getVerse({ verse: 'fog' }), { server: false })
// fetch Info Markdown
const { data: content } = await useAsyncData(async () => queryCollection('content').all())
// Set site data
await generalStore.setSiteData({ key: 'settings', value: SettingsData })
await generalStore.setSiteData({ key: 'content', value: content.value })
// Check local storage for auth token and try to authenticate if found
if (process.client) {
  const localStorageAuthToken = localStorage.getItem('fuitesAnarchiveAuthToken')
  if (!pocketAuth.value && localStorageAuthToken) {
    await pocketStore.getAuthPocket({ token: localStorageAuthToken, localStorageAuth: true })
  }
}

// ==================================================================== Computed
const verses = computed(() => pocket.value.data.verses.length ? pocket.value.data.verses : [verse.value.data])
const editingVerse = computed(() => verses.value.find(item => item._id === settingsModalVerseId.value) || null)
const markdown = computed(() => content.value || siteData.value?.content || [])
const infoMarkdown = computed(() => markdown.value.find(item => item.path === '/info'))

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

const setSettingsModalVerseId = verseId => {
  // Set the verse id for the verse settings modal
  settingsModalVerseId.value = verseId === settingsModalVerseId.value ? false : verseId
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

:deep(.alert) {
  z-index: 3;
}

.info-button {
  position: absolute;
  top: torem(20);
  right: torem(20);
  z-index: 3;
  :deep(.slot) {
    color: $drippyCore !important;
  }
}

.new-verse-button {
  position: absolute;
  bottom: torem(20);
  left: torem(20);
  --two-tone-a: #{$drippyCore};
  z-index: 3;
  @include mini {
    bottom: torem(42);
  }
  @include tiny {
    left: torem(8);
  }
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
  z-index: 3;
  @include mini {
    bottom: torem(42);
  }
  @include tiny {
    right: torem(8);
  }
}

.community-and-terms {
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  bottom: torem(14);
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  @include mini {
    bottom: torem(10);
  }
}

.separator {
  margin: 0 torem(8);
  font-size: torem(14);
  font-weight: 600;
  color: $drippyCore;
  @include small {
    font-size: torem(11);
    margin: 0 torem(4);
  }
}

.community-button {
  padding: 0;
  :deep(.slot) {
    font-size: torem(14);
    white-space: nowrap;
    color: $drippyCore !important;
    border-bottom: 0.5px solid transparent !important;
    @include small {
      font-size: torem(11);
    }
  }
  &:hover {
    :deep(.slot) {
      letter-spacing: 1px !important;
      border-bottom: 0.5px solid $drippyCore !important;
    }
  }
}

.icon {
  width: torem(16);
  height: torem(16);
  margin-left: torem(5);
}

.ftu-fyi-alert {
  z-index: 1000;
}

.verse-settings-modal-wrapper {
  @include mini {
    min-width: 90%;
  }
}
</style>
