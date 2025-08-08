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
// ======================================================================= Setup
const props = defineProps({
  baseFontsize: {
    type: Number,
    required: false,
    default: 26
  }
})
// ======================================================================== Data
const generalStore = useGeneralStore()
const { siteData } = storeToRefs(generalStore)

const text = 'fuit.es'
// const baseFontsize = 26
const params = computed(() => ({
  lsx: props.baseFontsize * (20 / 26), // horizontal Letter spacing
  lsy: props.baseFontsize * (20 / 26), // vertical Letter spacing
  jx: props.baseFontsize * (4 / 26) , // horizontal jitter
  jy: props.baseFontsize * (4 / 26), // vertical jitter
  freq: 0.25, // sin wave frequency
  fsj: props.baseFontsize * (6 / 26), // font size jitter
  deg: 10 // 3d rotation degrees
}))

// ==================================================================== Computed
const letters = computed(() => text.split(''))
const fontfamilies = computed(() => siteData.value?.settings?.fonts?.map(font => font.class) || [])

// ===================================================================== Methods
const getFontClass = () => fontfamilies.value[Math.floor(Math.random() * fontfamilies.value.length)]
const getLetterStyles = index => ({
  left: `${(params.value.lsx * index + Math.random() * params.value.jx)}px`,
  top: `${(params.value.lsy * Math.sin(params.value.freq * index) + Math.random() * params.value.jy)}px`,
  fontSize: `${props.baseFontsize + (Math.floor(params.value.fsj * Math.random()))}px`,
  transform: `rotate3d(${Math.random()}, ${Math.random()}, ${Math.random()}, ${params.value.deg}deg)`
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
