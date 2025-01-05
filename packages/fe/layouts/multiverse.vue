<template>
  <div class="multiverse">

    <slot />

    <!-- <VerseViewport /> -->

    <Toaster />

  </div>
</template>

<script setup>
// ======================================================================= Setup
if (process.client && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  useHead({
    meta: [
      { name: 'msapplication-config', content: '/favicon/dark/browserconfig.xml' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon/dark/favicon-96x96.png' },
      { rel: 'manifest', href: '/favicon/dark/manifest.json' }
    ]
  })
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.multiverse {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
