<template>
  <div ref="ctn" class="bicho-canvas-wrapper">

    <canvas
      v-if="!resizing"
      ref="canvas"
      class="bicho-canvas">
    </canvas>

    <SpinnerTripleDot
      v-else
      class="theme-cove" />

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
const padding = 10
const ctn = ref(null)
const canvas = ref(null)
const coords = ref([])
const resizing = ref(false)
const canvasWidth = ref(200)
const pocketStore = usePocketStore()
const { fullscreen } = storeToRefs(pocketStore)

// ======================================================================= Hooks
onMounted(() => {
  nextTick(() => {
    initCanvas()
  })
})

// ==================================================================== Watchers
watch(fullscreen, () => {
  resizing.value = true
  setTimeout(() => {
    resizing.value = false
    nextTick(() => { initCanvas() })
  }, 450) // The time it takes for the pocket resize animation to end
})

// ===================================================================== Methods
const initCanvas = () => {
  if (canvas.value && ctn.value) {
    const rect = ctn.value.getBoundingClientRect()
    canvasWidth.value = rect.height // set the width and height based on the canvas height so the canvas is square
    canvas.value.width = rect.height
    canvas.value.height = rect.height
    const ctx = canvas.value.getContext('2d')
    ctx.lineWidth = 1
    canvas.value.addEventListener('mousedown', mousedown)
    canvas.value.addEventListener('touchstart', touchstart)
  }
}

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
  const x = Math.max(padding, Math.min(canvasWidth.value + padding, e.clientX - rect.left))
  const y = Math.max(padding, Math.min(canvasWidth.value + padding, e.clientY - rect.top))
  coords.value.push(x - padding, y - padding)
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
    const x = Math.max(padding, Math.min(canvasWidth.value + padding, e.touches[0].clientX - rect.left))
    const y = Math.max(padding, Math.min(canvasWidth.value + padding, e.touches[0].clientY - rect.top))
    coords.value.push(x - padding, y - padding)
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
  width: 100%;
  height: 100%;
}

.bicho-canvas {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  background-color: rgba(255, 255, 255, 0.8);
  @include focusBoxShadowSmall;
  border-radius: 0.25rem;
  padding: 0.625rem;
}

:deep(.spinner) {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
