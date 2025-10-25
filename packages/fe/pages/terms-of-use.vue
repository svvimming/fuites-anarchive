<template>
  <div class="page terms-of-use">

    <ClientOnly>
      <div class="background-panel">
        <div
          v-for="item in backgroundVerses"
          :key="item.color"
          class="background-verse"
          :style="{
            left: `${item.rx * 100}%`,
            top: `${item.ry * 100}%`,
            backgroundColor: item.color,
            opacity: item.opacity
          }" />
      </div>
    </ClientOnly>

    <div class="grid">
      <div class="col">
        <div class="terms-of-use-container">

          <div class="logo-container">
            <SiteLogo v-once />
          </div>

          <ContentRenderer
            v-if="termsOfUseMarkdown"
            :value="termsOfUseMarkdown"
            class="global-markdown-content terms-of-use-content" />
          </div>

      </div>
    </div>

  </div>
</template>

<script setup>
// ======================================================================= Setup
definePageMeta({ layout: 'empty' })

// ======================================================================== Data
// fetch Info Markdown
const { data: content } = await useAsyncData(async () => queryCollection('content').all())
// Site data
const generalStore = useGeneralStore()
const { siteData } = storeToRefs(generalStore)
// Set site data
if (!siteData.value?.content) {
  await generalStore.setSiteData({ key: 'content', value: content.value })
}
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
const markdown = computed(() => siteData.value?.content || [])
const termsOfUseMarkdown = computed(() => markdown.value.find(item => item.path === '/terms-of-use'))

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
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

.terms-of-use-container {
  position: relative;
  z-index: 2;
}

.logo-container {
  padding-top: torem(20);
  width: torem(160);
  transform: translateX(-100%);
  :deep(.letter) {
    color: $drippyCore;
  }
  @include xlarge {
    transform: translateX(0);
  }
}

.terms-of-use-content {
  color: $drippyDark !important;
  padding-top: torem(90);
  padding-bottom: torem(90);
  :deep(h1) {
    font-size: torem(32) !important;
  }
}

</style>
