<template>
  <div ref="ctn" class="bicho-canvas-wrapper">

    <canvas
      ref="canvas"
      :width="canvasWidth"
      :height="canvasHeight"
      class="bicho-canvas">
    </canvas>

  </div>
</template>

<script setup>
// ====================================================================== Import
import { useThrottleFn } from '@vueuse/core'

// ======================================================================= Setup
const props = defineProps({
  strokeColor: {
    type: String,
    required: false,
    default: '#6c6575'
  }
})

const emit = defineEmits(['path-completed']) 

// ======================================================================== Data
const ctn = ref(null)
const canvas = ref(null)
const coords = ref([])
const canvasWidth = ref(200)
const canvasHeight = ref(200)

// ======================================================================= Hooks
onMounted(() => {
  nextTick(() => {
    const rect = ctn.value.getBoundingClientRect()
    canvasWidth.value = rect.height
    canvasHeight.value = rect.height
    /** @TODO
     * NEED TO RESIZE CANVAS TO MATCH CONTAINER DIMENSIONS
     * */
    const ctx = canvas.value.getContext('2d')
    ctx.lineWidth = 1
    canvas.value.addEventListener('mousedown', mousedown)
    canvas.value.addEventListener('touchstart', touchstart)
  })
})

// ===================================================================== Methods
const drawBichoPath = close => {
  const ctx = canvas.value.getContext('2d')
  const len = coords.value.length
  ctx.strokeStyle = props.strokeColor
  ctx.beginPath()
  ctx.moveTo(coords.value[0], coords.value[1])
  for (let i = 2; i < len - 1; i += 2) {
    ctx.lineTo(coords.value[i], coords.value[i + 1])
  }
  if (close) { ctx.closePath() }
  ctx.stroke()
}

const mousedown = e => {
  document.onmousemove = useThrottleFn(e => { mousedrag(e) }, 50)
  document.onmouseup = mouseup
}

const mousedrag = e => {
  const rect = canvas.value.getBoundingClientRect()
  const x = Math.max(10, Math.min(210, e.clientX - rect.left))
  const y = Math.max(10, Math.min(210, e.clientY - rect.top))
  coords.value.push(x - 10, y - 10)
  drawBichoPath(false)
}

const mouseup = e => {
  document.onmousemove = null
  document.onmouseup = null
  drawBichoPath(true)
  const path = coords.value.map(num => Math.round(num)).join(' ')
  emit('path-completed', path)
}

const touchstart = () => {
  document.ontouchmove = useThrottleFn(e => { touchmove(e) }, 50)
  document.ontouchend = touchend
}

const touchmove = e => {
  e.preventDefault()
  if (e.touches.length > 0) {
    const rect = canvas.value.getBoundingClientRect()
    const x = Math.max(10, Math.min(210, e.touches[0].clientX - rect.left))
    const y = Math.max(10, Math.min(210, e.touches[0].clientY - rect.top))
    coords.value.push(x - 10, y - 10)
    drawBichoPath(false)
  }
}

const touchend = () => {
  document.ontouchmove = null
  document.ontouchend = null
  if (coords.value.length) {
    drawBichoPath(true)
    const path = coords.value.map(num => Math.round(num)).join(' ')
    emit('path-completed', path)
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.bicho-canvas-wrapper {
  position: relative;
  margin-bottom: 1.5rem;
  flex-grow: 1;
}

.bicho-canvas {
  background-color: rgba(255, 255, 255, 0.8);
  @include focusBoxShadowSmall;
  border-radius: 0.25rem;
  padding: 0.625rem;
  
}
</style>
