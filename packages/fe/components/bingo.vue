<template>
  <div class="bingo">

    <span
      v-for="(letter, i) in letters"
      :class="['letter', 'no-select', getFontClass()]"
      :style="getLetterStyles(i)">

      {{ letter }}

    </span>

  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters } from 'vuex'

// ====================================================================== Export
export default {
  name: 'Bingo',

  props: {
    text: {
      type: String,
      required: true,
      default: ''
    },
    fontSize: {
      type: Number,
      required: false,
      default: 16
    },
    custom: {
      type: Object,
      required: false,
      default: () => ({})
    }
  },

  data () {
    return {
      defaults: {
        lsx: 50, // horizontal Letter spacing
        lsy: 30, // vertical Letter spacing
        jx: 40, // horizontal jitter
        jy: 10, // vertical jitter
        freq: 0.25, // sin wave frequency
        fsj: 30, // font size jitter
        deg: 10 // 3d rotation degrees
      }
    }
  },

  computed: {
    ...mapGetters({
      landing: 'general/landing'
    }),
    fonts () {
      return this.landing.data.font_families
    },
    letters () {
      return this.text.split('')
    },
    parameters () {
      return Object.assign(this.defaults, this.custom)
    }
  },

  methods: {
    getLetterStyles (index) {
      return {
        left: `${(this.parameters.lsx * index + Math.random() * this.parameters.jx)}px`,
        top: `${(this.parameters.lsy * Math.sin(this.parameters.freq * index) + Math.random() * this.parameters.jy)}px`,
        fontSize: `${this.fontSize + (Math.floor(this.parameters.fsj * Math.random()))}px`,
        transform: `rotate3d(${Math.random()}, ${Math.random()}, ${Math.random()}, ${this.parameters.deg}deg)`
      }
    },
    getFontClass () {
      return this.fonts[Math.floor(Math.random() * this.fonts.length)]
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.bingo,
.letter {
  position: absolute;
}

.letter {
  display: block;
  color: black;
}

.anton {
  @include fontFamily_Anton;
}
.arvo {
  @include fontFamily_Arvo;
}
.courier {
  @include fontFamily_CourierPrime;
}
.merriweather {
  @include fontFamily_Merriweather;
}
.nanum {
  @include fontFamily_NanumMyeongjo;
}
.source-code {
  @include fontFamily_SourceCodePro;
}
</style>
