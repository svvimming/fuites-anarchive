<template>
  <div class="bingo">

    <span
      v-for="(letter, i) in letters"
      :class="['letter', getFontClass()]"
      :style="getLetterStyles(i)">

      {{ letter }}

    </span>

  </div>
</template>

<script>
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
    maxOffset: {
      type: Number,
      required: false,
      default: 30
    },
    orientation: {
      type: Number,
      required: false,
      default: 10
    }
  },

  data () {
    return {
      fonts: [
        'anton',
        'arvo',
        'courier',
        'merriweather',
        'nanum',
        'source-code'
      ]
    }
  },

  computed: {
    letters () {
      return this.text.split('')
    }
  },

  methods: {
    getLetterStyles (index) {
      return {
        left: `${(50 * index + Math.random() * 40)}px`,
        top: `${(30 * Math.sin(0.25 * index) + Math.random() * 10)}px`,
        fontSize: `${this.fontSize + (Math.floor(this.maxOffset * Math.random()))}px`,
        transform: `rotate3d(${Math.random()}, ${Math.random()}, ${Math.random()}, ${this.orientation}deg)`
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
