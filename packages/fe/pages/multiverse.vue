<template>
  <div class="multiverse">
    <!-- ======================================================== Token Auth -->
    <MultiverseAuthAlert />
    <!-- ================================================ Create Verse Alert -->
    <MultiverseCreateVerseAlert />
    <!-- ========================================================= Main page -->
    <div class="grid">
      <div class="col-5" data-push-left="off-2">

        <span class="title text">Verses</span>
        <span class="desc text">The verses listed below are accessible to your token:</span>
        
        <div class="verse-list">
          <!-- ------------------------------------------------------ Verses -->
          <ClientOnly>
            <ButtonBasic
              v-for="verse in verses"
              :key="verse.name"
              tag="nuxt-link"
              :to="getVersePageRoute(verse)"
              theme="verse"
              class="list-item">
              <span>{{ verse.name }}</span>
              <!-- <IconGoto /> -->
            </ButtonBasic>
          </ClientOnly>
          <!-- -------------------------------------------- Create new Verse -->
          <ButtonBasic
            class="list-item new-verse-button"
            @clicked="handleCreateNewVerseClick">
            <span>Create new verse</span>
            <IconPlus class="icon" />
          </ButtonBasic>

        </div>
      </div>
    </div>

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
  alertStore.openAlert('multiverse-create-verse-alert')
}

const getVersePageRoute = verse => {
  const page = verse.page_refs.find(item => item.name !== 'compost')
  return `/${verse.name}/${page.name}`
}
</script>

<style lang="scss" scoped>
.multiverse {
  position: relative;
  width: 100%;
  height: 100%;
  padding-top: torem(160);
}

.verse-list {
  display: flex;
  flex-direction: column;
  padding-top: torem(16);
}

.list-item {
  display: block;
}

.new-verse-button {
  margin: torem(10) 0;
  width: fit-content;
  padding: torem(10) torem(18);
  :deep(.slot) {
    display: flex;
    align-items: center;
  }
  .icon {
    width: torem(10);
    height: torem(10);
    margin-left: torem(4);
    :deep(path) {
      fill: white;
    }
  }
}

.title,
.desc {
  margin-bottom: torem(10);
}
.title {
  font-weight: 600;
}
.text {
  display: block;
  font-size: torem(12);
  line-height: 1.5;
}
</style>
