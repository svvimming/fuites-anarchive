<template>
  <nuxt-link
    to="/"
    class="site-logo bingo">
    <ClientOnly>
      <div
        v-for="(letter, i) in letters"
        v-once
        :class="['letter', 'no-select', getFontClass()]"
        :style="getLetterStyles(i)">
        <span>{{ letter }}</span>
      </div>
    </ClientOnly>
  </nuxt-link>
</template>

<script setup>
// ======================================================================== Data
const generalStore = useGeneralStore()
const { siteData } = storeToRefs(generalStore)

const text = 'fuit.es'
const baseFontsize = 26
const params = {
  lsx: 20, // horizontal Letter spacing
  lsy: 20, // vertical Letter spacing
  jx: 4, // horizontal jitter
  jy: 4, // vertical jitter
  freq: 0.25, // sin wave frequency
  fsj: 6, // font size jitter
  deg: 10 // 3d rotation degrees
}

// ==================================================================== Computed
const letters = computed(() => text.split(''))
const fontfamilies = computed(() => siteData.value?.settings?.fonts?.map(font => font.class) || [])

// ===================================================================== Methods
const getFontClass = () => fontfamilies.value[Math.floor(Math.random() * fontfamilies.value.length)]
const getLetterStyles = index => ({
  left: `${(params.lsx * index + Math.random() * params.jx)}px`,
  top: `${(params.lsy * Math.sin(params.freq * index) + Math.random() * params.jy)}px`,
  fontSize: `${baseFontsize + (Math.floor(params.fsj * Math.random()))}px`,
  transform: `rotate3d(${Math.random()}, ${Math.random()}, ${Math.random()}, ${params.deg}deg)`
})

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.site-logo {
  display: block;
  position: relative;
  height: torem(80);
}

.letter {
  position: absolute;
  display: block;
  padding: torem(8);
  color: $woodsmoke;
  span {
    display: block;
    transition: 150ms ease;
  }
  &:hover {
    span {
      transform: scale(1.15);
    }
  }
}
</style>
