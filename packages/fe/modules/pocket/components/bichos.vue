<template>
  <div class="bicho-canvas-wrapper">
    <canvas
      ref="canvas"
      width="200"
      height="200"
      class="bicho-canvas"
      v-hammer:panmove="touchmove($event)"
      v-hammer:panend="touchend">
    </canvas>
  </div>
</template>

<script>
// =================================================================== Functions
const initBichoCanvas = (instance) => {
  const canvas = instance.$refs.canvas
  const ctx = canvas.getContext('2d')
  ctx.lineWidth = 1
  canvas.addEventListener('mousedown', instance.mousedown)
  canvas.addEventListener('touchstart', instance.touchstart)
}

const drawBichoPath = (instance, closePath) => {
  const ctx = instance.$refs.canvas.getContext('2d')
  const coords = instance.coords
  const len = instance.coords.length
  ctx.strokeStyle = instance.strokeColor
  ctx.beginPath()
  ctx.moveTo(coords[0], coords[1])
  for (let i = 2; i < len - 1; i += 2) {
    ctx.lineTo(coords[i], coords[i + 1])
  }
  if (closePath) {
    ctx.closePath()
  }
  ctx.stroke()
}

// ====================================================================== Export
export default {
  name: 'Bichos',

  props: {
    strokeColor: {
      type: String,
      required: false,
      default: '#6c6575'
    }
  },

  data () {
    return {
      coords: []
    }
  },

  mounted () {
    this.$nextTick(() => { initBichoCanvas(this) })
  },

  methods: {
    mousedown (e) {
      document.onmousemove = this.$throttle((e) => { this.mousedrag(e) }, 50)
      document.onmouseup = this.mouseup
    },
    mousedrag (e) {
      const canvas = this.$refs.canvas
      const rect = canvas.getBoundingClientRect()
      const x = Math.max(10, Math.min(210, e.clientX - rect.left))
      const y = Math.max(10, Math.min(210, e.clientY - rect.top))
      this.coords.push(x - 10, y - 10)
      drawBichoPath(this, false)
    },
    mouseup (e) {
      document.onmousemove = null
      document.onmouseup = null
      drawBichoPath(this, true)
      const pathData = this.coords.map(num => Math.round(num)).join(' ')
      this.$emit('path-complete', pathData)
    },
    // touchstart () {
    //   document.ontouchmove
    // },
    touchmove (e) {
      console.log(e)
      if (e.touches.length > 0) {
        const canvas = this.$refs.canvas
        const rect = canvas.getBoundingClientRect()
        const x = Math.max(10, Math.min(210, e.touches[0].clientX - rect.left))
        const y = Math.max(10, Math.min(210, e.touches[0].clientY - rect.top))
        this.coords.push(x - 10, y - 10)
        drawBichoPath(this, false)
      }
    },
    touchend () {
      if (this.coords.length) {
        drawBichoPath(this, true)
        const pathData = this.coords.map(num => Math.round(num)).join(' ')
        this.$emit('path-complete', pathData)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.bicho-canvas-wrapper {
  position: relative;
}
.bicho-canvas {
  background-color: rgba(255, 255, 255, 0.5);
  @include focusBoxShadowSmall;
  border-radius: 0.25rem;
  padding: 0.625rem;
}
</style>
