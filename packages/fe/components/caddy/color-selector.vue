<template>
  <div class="color-picker">
    <div
      id="color-wheel"
      ref="wheel"
      class="cpw_container"
      :style="{ width: `${width}px`, height: `${height}px` }">
      <div
        ref="farbtastic-solid"
        class="farbtastic-solid"
        :style="solidStyle">
      </div>
      <canvas
        ref="mask"
        class="farbtastic-mask"
        :style="{width, height}"
        :width="width"
        :height="height" />
      <canvas
        ref="overlay"
        :width="width"
        :height="height"
        class="farbtastic-overlay"
        :style="{ width, height }"
        @mousedown="mousedown" />
    </div>
  </div>
</template>

<script setup>
// ======================================================================= Setup
const props = defineProps({
  initColor: {
    type: String,
    required: false,
    default: '#000000'
  }
})

const emit = defineEmits(['color-change'])

// ======================================================================== Data
const dragging = ref(false)
const circleDrag = ref(false)
const color = ref('')
const rgb = ref('')
const hsl = ref('')
const radius = ref(0)
const square = ref(0)
const mid = ref(0)
const width = ref(104)
const height = ref(104)
const markerSize = ref(0)
const invert = ref(0)

const wheel = ref(null)
const mask = ref(null)
const overlay = ref(null)
const maskCtx = ref(false)
const overlayCtx = ref(false)

const offset = ref({ left: '', top: '' })

// ==================================================================== Computed
const wheelWidth = computed(() => width.value / 10)
const solidStyle = computed(() => ({
  'background-color': pack(HSLToRGB([hsl.value[0], 1, 0.5])),
  width: `${square.value * 2 - 1}px`,
  height: `${square.value * 2 - 1}px`,
  left: `${mid.value - square.value}px`,
  top: `${mid.value - square.value}px`
}))

// ==================================================================== Watchers
watch(() => props.initColor, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    setColor(newVal, true)
  }
})

// ======================================================================= Hooks
onMounted(() => {
  initWidget()
  setColor(props.initColor, true)
})

// ===================================================================== Methods
/**
 * @method initWidget
 */

const initWidget = () => {
  // Determine layout
  radius.value = (width.value - wheelWidth.value) / 2 - 1
  square.value = Math.floor((radius.value - wheelWidth.value / 2) * 0.7) - 1
  mid.value = Math.floor(width.value / 2)
  markerSize.value = wheelWidth.value * 0.3
  // Set up drawing context.
  maskCtx.value = mask.value.getContext('2d')
  overlayCtx.value = overlay.value.getContext('2d')
  upscaleCanvas(mask.value)
  upscaleCanvas(overlay.value)
  maskCtx.value.translate(mid.value, mid.value)
  overlayCtx.value.translate(mid.value, mid.value)
  // Draw widget base layers.
  drawCircle()
  drawMask()
}

/**
 * @method drawCircle
 */

const drawCircle = () => {
  // Draw a hue circle with a bunch of gradient-stroked beziers.
  // Have to use beziers, as gradient-stroked arcs don't work.
  const n = 24
  const nudge = (8 / radius.value / n) * Math.PI // Fudge factor for seams.
  let angle1 = 0
  let angle2
  // let d1;
  let color1
  let color2
  maskCtx.value.save()
  maskCtx.value.lineWidth = wheelWidth.value / radius.value
  maskCtx.value.scale(radius.value, radius.value)
  // Each segment goes from angle1 to angle2.
  // eslint-disable-next-line
  for (let i = 0; i <= n; ++i) {
      const d2 = i / n
      angle2 = d2 * Math.PI * 2
      // Endpoints
      const x1 = Math.sin(angle1)
      const y1 = -Math.cos(angle1)
      const x2 = Math.sin(angle2)
      const y2 = -Math.cos(angle2)
      // Midpoint chosen so that the endpoints are tangent to the circle.
      const am = (angle1 + angle2) / 2
      const tan = 1 / Math.cos((angle2 - angle1) / 2)
      const xm = Math.sin(am) * tan
      const ym = -Math.cos(am) * tan
      // New color
      color2 = pack(HSLToRGB([d2, 1, 0.5]))
      if (i > 0) {
          // Create gradient fill between the endpoints.
          const grad = maskCtx.value.createLinearGradient(x1, y1, x2, y2)
          grad.addColorStop(0, color1)
          grad.addColorStop(1, color2)
          maskCtx.value.strokeStyle = grad
          // Draw quadratic curve segment.
          maskCtx.value.beginPath()
          maskCtx.value.moveTo(x1, y1)
          maskCtx.value.quadraticCurveTo(xm, ym, x2, y2)
          maskCtx.value.stroke()
      }
      // Prevent seams where curves join.
      angle1 = angle2 - nudge
      color1 = color2
      // d1 = d2;
  }
  maskCtx.value.restore()
}

/**
 * @method drawMask
 */

const drawMask = () => {
  // Iterate over sat/lum space and calculate appropriate mask pixel values.
  const size = square.value * 2
  const sq = square.value
  function calculateMask(sizex, sizey, outputPixel) {
    const isx = 1 / sizex
    const isy = 1 / sizey
    // eslint-disable-next-line
    for (let y = 0; y <= sizey; ++y) {
      const l = 1 - y * isy;
      // eslint-disable-next-line
      for (let x = 0; x <= sizex; ++x) {
        const s = 1 - x * isx;
        // From sat/lum to alpha and color (grayscale)
        const a = 1 - 2 * Math.min(l * s, (1 - l) * s)
        const c = a > 0 ? (2 * l - 1 + a) * (0.5 / a) : 0
        outputPixel(x, y, c, a)
      }
    }
  }

  // Method #1: direct pixel access (new Canvas).
  if (maskCtx.value.getImageData) {
    // Create half-resolution buffer.
    const sz = Math.floor(size / 2)
    const buffer = document.createElement('canvas')
    buffer.width = sz + 1
    buffer.height = sz + 1
    const ctx = buffer.getContext('2d')
    const frame = ctx.getImageData(0, 0, sz + 1, sz + 1)

    let i = 0
    calculateMask(sz, sz, (x, y, c, a) => {
      // eslint-disable-next-line
      frame.data[i++] = frame.data[i++] = frame.data[i++] = c * 255
      // eslint-disable-next-line
      frame.data[i++] = a * 255
    })

    ctx.putImageData(frame, 0, 0);
    maskCtx.value.drawImage(
      buffer,
      0,
      0,
      sz + 1,
      sz + 1,
      -sq,
      -sq,
      sq * 2,
      sq * 2
    )
  } else {
    // Render directly at half-resolution
    const sz = Math.floor(size / 2)
    calculateMask(sz, sz, (x, y, _c, a) => {
      const c = Math.round(_c * 255)
      maskCtx.value.fillStyle = `rgba(${c}, ${c}, ${c}, ${a})`
      maskCtx.value.fillRect(x * 2 - sq - 1, y * 2 - sq - 1, 2, 2)
    })
  }
}

/**
 * @method setColor
 */

const setColor = (clr, noEmit = false) => {
  const unpk = unpack(clr)
  if (color.value !== clr && unpk) {
    color.value = clr
    rgb.value = unpk
    hsl.value = RGBToHSL(rgb.value)
    updateDisplay(noEmit)
  }
}

/**
 * @method HSLToRGB
 */

const HSLToRGB = hsl => {
  const h = hsl[0]
  const s = hsl[1]
  const l = hsl[2]
  const m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s
  const m1 = l * 2 - m2
  return [
    hueToRGB(m1, m2, h + 0.33333),
    hueToRGB(m1, m2, h),
    hueToRGB(m1, m2, h - 0.33333)
  ]
}

/**
 * @method hueToRGB
 */

const hueToRGB = (m1, m2, h) => {
  h = (h + 1) % 1
  if (h * 6 < 1) return m1 + (m2 - m1) * h * 6
  if (h * 2 < 1) return m2
  if (h * 3 < 2) return m1 + (m2 - m1) * (0.66666 - h) * 6
  return m1
}

/**
 * @method pack
 */

const pack = rgb => {
  const r = Math.round(rgb[0] * 255)
  const g = Math.round(rgb[1] * 255)
  const b = Math.round(rgb[2] * 255)
  return `#${dec2hex(r) + dec2hex(g) + dec2hex(b)}`
}

/**
 * @method unpack
 */

const unpack = color => {
  if (color.length === 7) {
    return [1, 3, 5].map(i => parseInt(color.substring(i, i + 2), 16) / 255)
  } else if (color.length === 4) {
    return [1, 2, 3].map(i => parseInt(color.substring(i, i + 1), 16) / 15)
  }
  return false
}

const dec2hex = x => (x < 16 ? '0' : '') + x.toString(16)

/**
 * @method upscaleCanvas
 */

const upscaleCanvas = cnv => {
  const ctx = cnv.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const backingStoreRatio =
    ctx.webkitBackingStorePixelRatio ||
    ctx.mozBackingStorePixelRatio ||
    ctx.msBackingStorePixelRatio ||
    ctx.oBackingStorePixelRatio ||
    ctx.backingStorePixelRatio || 1
  if (dpr !== backingStoreRatio) {
    const ratio = dpr / backingStoreRatio
    const oldWidth = cnv.width
    const oldHeight = cnv.height
    cnv.width = oldWidth * ratio
    cnv.height = oldHeight * ratio
    cnv.style.width = `${oldWidth}px`
    cnv.style.height = `${oldHeight}px`
    ctx.scale(ratio, ratio)
  }
}

/**
 * @method updateDisplay
 */

const updateDisplay = noEmit => {
  // Determine whether labels/markers should invert.
  invert.value = rgb.value[0] * 0.3 + rgb.value[1] * 0.59 + rgb.value[2] * 0.11 <= 0.6
  // Draw markers
  drawMarkers()
  if (!noEmit) {
    // Emit color
    emit('color-change', color.value)
  }
}

/**
 * @method drawMarkers
 */

const drawMarkers = () => {
  // Determine marker dimensions
  const sz = width.value
  const lw = Math.ceil(markerSize.value / 4)
  const r = markerSize.value - lw + 1
  const angle = hsl.value[0] * 6.28
  const x1 = Math.sin(angle) * radius.value
  const y1 = -Math.cos(angle) * radius.value
  const x2 = 2 * square.value * (0.5 - hsl.value[1])
  const y2 = 2 * square.value * (0.5 - hsl.value[2])
  const c1 = invert.value ? '#fff' : '#000'
  const c2 = invert.value ? '#000' : '#fff'
  const circles = [
      { x: x1, y: y1, r, c: '#000', lw: lw + 1 },
      { x: x1, y: y1, r: markerSize.value, c: '#fff', lw },
      { x: x2, y: y2, r, c: c2, lw: lw + 1 },
      { x: x2, y: y2, r: markerSize.value, c: c1, lw }
  ]
  // Update the overlay canvas.
  overlayCtx.value.clearRect(-1 * mid.value, -1 * mid.value, sz, sz)
  for (let i = 0; i < circles.length; i += 1) {
    const c = circles[i]
    overlayCtx.value.lineWidth = c.lw
    overlayCtx.value.strokeStyle = c.c
    overlayCtx.value.beginPath()
    overlayCtx.value.arc(c.x, c.y, c.r, 0, Math.PI * 2, true)
    overlayCtx.value.stroke()
  }
}

const setHSL = val => {
  hsl.value = val
  rgb.value = HSLToRGB(hsl.value)
  color.value = pack(rgb.value)
  updateDisplay()
}

const widgetCoords = e => ({
  x: e.clientX - offset.value.left - mid.value,
  y: e.clientY - offset.value.top - mid.value
})

// const widgetCoordsTouch = e => ({
//   x: e.targetTouches[0].clientX - offset.value.left - mid.value,
//   y: e.targetTouches[0].clientY - offset.value.top - mid.value
// })

const mousedown = e => {
  // Capture mouse
  if (!dragging.value) {
    document.addEventListener('mousemove', mousemove)
    document.addEventListener('mouseup', mouseup)
    dragging.value = true
  }
  // Update the stored offset for the widget.
  const rect = wheel.value.getBoundingClientRect()
  offset.value = { left: rect.left, top: rect.top }
  // Check which area is being dragged
  const pos = widgetCoords(e)
  circleDrag.value = Math.max(Math.abs(pos.x), Math.abs(pos.y)) > square.value + 2
  // Process
  mousemove(e)
}

const mousemove = e => {
  // Get coordinates relative to color picker center
  const pos = widgetCoords(e)
  // Set new HSL parameters
  if (circleDrag.value) {
    const hue = Math.atan2(pos.x, -1 * pos.y) / (Math.PI * 2)
    setHSL([(hue + 1) % 1, hsl.value[1], hsl.value[2]])
  } else {
    const sat = Math.max(0, Math.min(1, -(pos.x / square.value / 2) + 0.5))
    const lum = Math.max(0, Math.min(1, -(pos.y / square.value / 2) + 0.5))
    setHSL([hsl.value[0], sat, lum]);
  }
  return false
}

const mouseup = () => {
  // Uncapture mouse
  document.removeEventListener('mousemove', mousemove)
  document.removeEventListener('mouseup', mouseup)
  dragging.value = false
}
          
// const packDX = (c, a) => `#${dec2hex(a) + dec2hex(c) + dec2hex(c) + dec2hex(c)}`

const RGBToHSL = val => {
  const r = val[0]
  const g = val[1]
  const b = val[2]
  const min = Math.min(r, g, b)
  const max = Math.max(r, g, b)
  const delta = max - min
  let h = 0
  let s = 0
  const l = (min + max) / 2
  if (l > 0 && l < 1) {
    s = delta / (l < 0.5 ? 2 * l : 2 - 2 * l)
  }
  if (delta > 0) {
    if (max === r && max !== g) h += (g - b) / delta
    if (max === g && max !== b) h += 2 + (b - r) / delta
    if (max === b && max !== r) h += 4 + (r - g) / delta
    h /= 6
  }
  return [h, s, l]
}
          
// touchHandleStart(event) {
//     // Ignore the event if another is already being handled
//     if (this.touchHandled) {
//         return;
//     }

//     // Set the flag to prevent others from inheriting the touch event
//     this.touchHandled = true;

//     // Track movement to determine if interaction was a click
//     this._touchMoved = false;

//     // Update the stored offset for the widget.
//     this.offset = {
//         left: this.$refs['color-wheel'].getBoundingClientRect().left,
//         top: this.$refs['color-wheel'].getBoundingClientRect().top
//     };

//     // Check which area is being dragged
//     const pos = this.widgetCoordsTouch(event);
//     this.circleDrag =
//         Math.max(Math.abs(pos.x), Math.abs(pos.y)) > this.square + 2;
// }
// /**
//  * Handle the touchstart events
//  */
// touchHandleMove(event) {
//     // Ignore event if not handled
//     if (!this.touchHandled) {
//         return;
//     }
//     event.preventDefault();

//     // Interaction was not a click
//     this._touchMoved = true;

//     // Get coordinates relative to color picker center
//     const pos = this.widgetCoordsTouch(event);

//     // Set new HSL parameters
//     if (this.circleDrag) {
//         const hue = Math.atan2(pos.x, -pos.y) / 6.28;
//         this.setHSL([(hue + 1) % 1, this.hsl[1], this.hsl[2]]);
//     } else {
//         const sat = Math.max(0, Math.min(1, -(pos.x / this.square / 2) + 0.5));
//         const lum = Math.max(0, Math.min(1, -(pos.y / this.square / 2) + 0.5));
//         this.setHSL([this.hsl[0], sat, lum]);
//     }
// }
// /**
//  * Handle the touchstart events
//  */
// touchHandleEnd() {
//     // Ignore event if not handled
//     if (!this.touchHandled) {
//         return;
//     }
//     // Unset the flag to allow other widgets to inherit the touch event
//     this.touchHandled = false;
// }
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.color-picker {
  display: flex;
  justify-content: center;
  align-items: center;
  width: torem(152);
  height: torem(152);
}

.cpw_container {
  position: relative;
  -webkit-touch-callout: none; /* prevent callout to copy image, etc when tap to hold */
  text-size-adjust:none; /* prevent webkit from resizing text to fit */
  tap-highlight-color:rgba(0,0,0,0); /* prevent tap highlight color*/
  tap-highlight-color: transparent; /* prevent tap highlight color*/
  user-select:none;
  transition: 300ms ease;
  border-radius: 50%;
}

.farbtastic-solid {
  position: absolute;
}

.farbtastic-mask {
  position: absolute;
  left: 0;
}

.farbtastic-overlay {
  position: absolute;
  left: 0;
} 
</style>
