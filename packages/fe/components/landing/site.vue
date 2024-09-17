<template>
  <header id="landing-site">

      Landing Site

  </header>
</template>

<script setup>
// ======================================================================== Data
// const { data: navigation } = await useAsyncData('navigation', async () => {
//   const content = await queryContent({
//     where: {
//       _file: { $contains: 'data/navigation.json' }
//     }
//   }).find()
//   return content[0]
// })
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
#landing-site {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
</style>
