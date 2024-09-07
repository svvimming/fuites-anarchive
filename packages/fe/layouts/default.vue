<template>
  <div class="layout default">

    <SiteHeader />

    <slot />

    <SiteFooter />

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
.layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
}
</style>
