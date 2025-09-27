<template>
  <div class="page community-guidelines">

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
        <div class="community-guidelines-container">

          <div class="logo-container">
            <SiteLogo v-once />
          </div>

          <ContentRenderer
            v-if="communityGuidelinesMarkdown"
            :value="communityGuidelinesMarkdown"
            class="global-markdown-content community-guidelines-content" />
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
const { data: markdown } = await useAsyncData(async () => queryCollection('content').all())

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
const communityGuidelinesMarkdown = computed(() => markdown.value.find(item => item.path === '/community-guidelines'))
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

.community-guidelines-container {
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

.community-guidelines-content {
  color: $drippyDark !important;
  padding-top: torem(90);
  padding-bottom: torem(90);
  :deep(h1) {
    font-size: torem(40) !important;
  }
  :deep(h3) {
    font-size: torem(22) !important;
    margin-top: torem(36);
    margin-bottom: torem(30);
  }
}

</style>
