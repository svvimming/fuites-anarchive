<template>
  <div class="scatter">

    <div
      v-for="(ip, i) in ips"
      :key="`ip-${i}-${image}`"
      :class="['ip', ip.animation]"
      :style="getIpStyles(ip)"
      @mouseover="mouseEnter(i)">
    </div>

  </div>
</template>

<script>
// =================================================================== Functions
const initIps = (instance) => {
  const density = instance.density
  const amount = instance.amount
  const w = instance.ipWidth
  for (let i = 0; i < amount; i++) {
    instance.ips.push({
      x: Math.random() * density,
      y: Math.random() * density,
      w: 10 + Math.random() * w,
      h: 10 + Math.random() * w,
      animation: 'appear',
      imgpos: `${-100 * Math.random()}% ${-100 * Math.random()}%`
    })
  }
}

const handleMouseEnter = (instance, index) => {
  const ip = instance.ips[index]
  ip.animation = 'disappear'
  setTimeout((offsetX, offsetY) => {
    ip.x += 6 * offsetX
    ip.y += 6 * offsetY
    ip.animation = 'appear'
  }, 400, instance.delta.x, instance.delta.y)
}

const handleMouseMove = (e, instance) => {
  const px = e.pageX
  const py = e.pageY
  instance.delta.x = px - instance.mouse.x
  instance.delta.y = py - instance.mouse.y
  instance.mouse.x = px
  instance.mouse.y = py
}
// ====================================================================== Export
export default {
  name: 'Scatter',

  props: {
    image: {
      type: String,
      required: true,
      default: ''
    },
    density: {
      type: Number,
      required: false,
      default: 100
    },
    amount: {
      type: Number,
      required: false,
      default: 10
    },
    ipWidth: {
      type: Number,
      required: false,
      default: 40
    }
  },

  data () {
    return {
      ips: [],
      move: false,
      mouse: {
        x: 0,
        y: 0
      },
      delta: {
        x: 0,
        y: 0
      }
    }
  },

  mounted () {
    initIps(this)

    this.move = (e) => { handleMouseMove(e, this) }
    window.addEventListener('mousemove', this.move)
  },

  beforeDestroy() {
    if (this.move) { window.removeEventListener('mousemove', this.move) }
  },

  methods: {
    getIpStyles (ip) {
      return {
        left: `${ip.x}px`,
        top: `${ip.y}px`,
        width: `${ip.w}px`,
        height: `${ip.h}px`,
        backgroundPosition: ip.imgpos,
        backgroundImage: `url(${this.image})`
      }
    },
    mouseEnter (index) {
      handleMouseEnter(this, index)
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.scatter,
.ip {
  position: absolute;
}

// ////////////////////////////////////////////////////////////////// Animations
.appear {
  @include popInAnimation;
}
.disappear {
  @include popOutAnimation;
}

</style>
