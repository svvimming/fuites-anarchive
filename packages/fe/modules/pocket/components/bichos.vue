<template>
  <div class="bicho-canvas-wrapper">
    <canvas
      ref="canvas"
      width="200"
      height="200"
      class="bicho-canvas">
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
}

const drawBichoPath = (instance, closePath) => {
  const ctx = instance.$refs.canvas.getContext('2d')
  const coords = instance.coords
  const len = instance.coords.length
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
      const x = Math.max(0, Math.min(200, e.clientX - rect.left))
      const y = Math.max(0, Math.min(200, e.clientY - rect.top))
      this.coords.push(x, y)
      drawBichoPath(this, false)
    },
    mouseup (e) {
      document.onmousemove = null
      document.onmouseup = null
      drawBichoPath(this, true)
      this.$emit('path-complete', this.coords)
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
  border: 1px solid black;
}
</style>
