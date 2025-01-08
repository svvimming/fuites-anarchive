<template>
  <div class="site-logo bingo">
    <ClientOnly>
      <span
        v-for="(letter, i) in letters"
        :class="['letter', 'no-select', getFontClass()]"
        :style="getLetterStyles(i)">
        {{ letter }}
      </span>
    </ClientOnly>
  </div>
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
const fontfamilies = computed(() => siteData.value?.settings?.fonts.map(font => font.class) || [])

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
  position: relative;
  height: torem(80);
}

.letter {
  position: absolute;
}

.letter {
  display: block;
  color: black;
}

// .anton {
//   @include fontFamily_Anton;
// }
// .arvo {
//   @include fontFamily_Arvo;
// }
// .courier {
//   @include fontFamily_CourierPrime;
// }
// .merriweather {
//   @include fontFamily_Merriweather;
// }
// .nanum {
//   @include fontFamily_NanumMyeongjo;
// }
// .source-code {
//   @include fontFamily_SourceCodePro;
// }
</style>
