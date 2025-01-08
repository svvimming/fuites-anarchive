<template>
  <div class="info-page">
    <div class="grid">

      <div
        class="col-10_mi-12"
        data-push-left="off-1_mi-0">

        <div class="title">
          <h1>About</h1>
          <SiteLogo />
        </div>

        <div class="markdown-content">
          <ContentRendererMarkdown v-if="markdown" :value="markdown" />
        </div>

        <div class="sponsors">
          <IconCanadaCouncil class="canada-council-icon" />
          <span>We acknowledge the support of the Canada Council for the Arts.</span>
          <span>Nous remercions le Conseil des arts du Canada de son soutien.</span>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup>
// ======================================================================= Setup
definePageMeta({ layout: 'empty' })

// ======================================================================== Data
const { data } = await useAsyncData('info', async () => {
  const content = await queryContent({
    where: {
      _file: { $containsAny: ['settings.json', 'info.md'] }
    }
  }).find()
  return content
})

const generalStore = useGeneralStore()
const markdown = ref(false)

// ==================================================================== Watchers
watch(data, async () => {
  const settings = data.value.find(item => item._file === 'data/settings.json')
  await generalStore.setSiteData({ key: 'settings', value: settings })
  markdown.value = data.value.find(item => item._file === 'data/info.md')
}, { immediate: true })

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.info-page {
  position: relative;
  padding-top: torem(140);
  overflow: hidden;
  &:before,
  &:after {
    content: '';
    position: absolute;
    left: calc(50% + torem(500));
    top: 0;
    width: torem(1350);
    height: torem(1033);
    transform: translate(-50%, torem(-260));
    z-index: 1;
  }
  &:before {
    background-image: url('/mew.png');
    background-size: cover;
    background-repeat: no-repeat;
    opacity: 0.4;
  }
  &:after {
    background: linear-gradient(97deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 33%, rgba(255,255,255,0) 66%, rgba(255,255,255,1) 100%), linear-gradient(0deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 50%);;
  }
}

.title {
  display: flex;
  position: relative;
  z-index: 2;
  h1 {
    font-size: torem(26);
    font-family: 'Nanum Myeongjo', serif;
    margin-top: torem(7);
    margin-right: torem(16);
  }
  :deep(.site-logo) {
    span {
      &:first-child {
        font-family: 'Nanum Myeongjo', serif !important;
      }
    }
  }
}

.markdown-content {
  position: relative;
  z-index: 2;
  padding: torem(80) 0;
  :deep(h1) {
    font-size: torem(26);
  }
  :deep(a) {
    font-weight: 600;
    border-bottom: solid 0.5px rgba($woodsmoke, 0);
    transition: 150ms ease;
    &:hover {
      border-bottom: solid 0.5px rgba($woodsmoke, 1);
    }
  }
  :deep(h3) {
    font-size: torem(18);
    margin-top: torem(42);
  }
  :deep(h1),
  :deep(h3) {
    font-family: 'Nanum Myeongjo', serif;
    margin-bottom: torem(24);
  }
  :deep(p) {
    font-size: torem(14);
    margin-bottom: torem(16);
    &:first-child {
      margin-bottom: torem(32);
    }
  }
}

.sponsors {
  position: relative;
  z-index: 2;
  padding-bottom: torem(160);
  span {
    display: block;
    font-size: torem(14);
  }
}

.canada-council-icon {
  width: torem(380);
  margin-bottom: torem(24);
}

:deep(.cls-1) {
  fill: #111111;
}
</style>
