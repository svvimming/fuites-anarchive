<template>
  <div class="verses-overview">
    <!-- ======================================================== Token Auth -->
    <OverviewAuthAlert />

    <OverviewCreateVerseAlert />
    <!-- ========================================================= Main page -->
    <div class="grid">
      <div class="col-5" data-push-left="off-2">

        <span class="title text">Verses</span>
        <span class="desc text">The verses listed below are accessible to your token:</span>
        
        <div class="verse-list">
          <!-- ------------------------------------------------------ Verses -->
          <ButtonBasic
            v-for="verse in verses"
            :key="verse.name"
            tag="nuxt-link"
            :to="`/${verse.name}/${verse.page_refs[0].name}`"
            theme="verse"
            class="list-item">
            <span>{{ verse.name }}</span>
            <!-- <IconGoto /> -->
          </ButtonBasic>
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
definePageMeta({ layout: 'verses' })

// ======================================================================== Data
const route = useRoute()
const generalStore = useGeneralStore()
const alertStore = useZeroAlertStore()
const pocketStore = usePocketStore()
const { pocket } = storeToRefs(pocketStore)

const { data } = await useAsyncData(route.fullPath, async () => {
  const content = await queryContent({
    where: {
      _file: { $contains: 'settings.json' }
    }
  }).find()
  return content[0]
})

// ==================================================================== Computed
const verses = computed(() => pocket.value.data?.verses || [])

// ==================================================================== Watchers
watch(data, async () => {
  await generalStore.setSiteData({ key: 'settings', value: data.value })
}, { immediate: true })

const handleCreateNewVerseClick = () => {
  alertStore.openAlert('overview-create-verse-alert')
}
</script>

<style lang="scss" scoped>
.verses-overview {
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
