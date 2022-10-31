<template>
  <div class="canvas-container">

    <canvas class="glCanvas" ref="glCanvas"></canvas>

    <slot></slot>

  </div>
</template>

<script>
// ///////////////////////////////////////////////////////////////////// Imports
import Throttle from 'lodash/throttle'

import vertexShaderSource from '@/assets/glsl/2d.vert'
import fragmentShaderSource from '@/assets/glsl/cull.frag'

// /////////////////////////////////////////////////////////////////// Functions
const initWebglCanvas = (instance) => {
  resizeCanvas(instance)

  const canvas = instance.$refs.glCanvas
  const gl = canvas.getContext('webgl')

  canvas.addEventListener('mousemove', (e) => { updateMousePosition(e, instance) }, false)

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.')
    return
  }

  const shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource)

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition')
    },
    uniformLocations: {
      resolution: gl.getUniformLocation(shaderProgram, 'u_resolution'),
      time: gl.getUniformLocation(shaderProgram, 'u_time'),
      level: gl.getUniformLocation(shaderProgram, 'u_level'),
      throb: gl.getUniformLocation(shaderProgram, 'u_throb'),
      mouse: gl.getUniformLocation(shaderProgram, 'u_mouse'),
      bins: gl.getUniformLocation(shaderProgram, 'u_bins'),
      uSampler: gl.getUniformLocation(shaderProgram, "u_sampler")
    }
  }

  const buffers = initBuffers(gl)
  const texture = initTexture(gl)
  if (instance.image) {
    updateTexture(gl, texture, instance.image)
  }
  let i = 0
  // Draw the scene repeatedly
  function render () {
    drawScene(instance, gl, programInfo, buffers, texture, i)
    i += 33
    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
}

// Initialize buffers
const initBuffers = (gl) => {
  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

  const positions = [
    1.0, 1.0,
    -1.0, 1.0,
    1.0, -1.0,
    -1.0, -1.0
  ]

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

  return { position: positionBuffer }
}

function initTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Because video havs to be download over the internet
  // they might take a moment until it's ready so
  // put a single pixel in the texture so we can
  // use it immediately.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel
  );

  // Turn off mips and set  wrapping to clamp to edge so it
  // will work regardless of the dimensions of the video.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  return texture;
}

function updateTexture(gl, texture, image) {
  const level = 0;
  const internalFormat = gl.RGBA;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    srcFormat,
    srcType,
    image
  );
}

// Draw the scene.
const drawScene = (instance, gl, programInfo, buffers, texture, time) => {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.clearDepth(1.0)
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  {
    const numComponents = 2
    const type = gl.FLOAT
    const normalize = false
    const stride = 0
    const offset = 0
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset
    )
    gl.enableVertexAttribArray(
      programInfo.attribLocations.vertexPosition
    )
  }

  gl.useProgram(programInfo.program)

  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE0);

  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

  // Set shader uniforms
  gl.uniform2fv(programInfo.uniformLocations.resolution, [gl.canvas.width, gl.canvas.height])
  gl.uniform1f(programInfo.uniformLocations.time, time)
  gl.uniform1f(programInfo.uniformLocations.level, 0.5)
  gl.uniform1f(programInfo.uniformLocations.throb, instance.throb)
  gl.uniform2fv(programInfo.uniformLocations.mouse, [instance.mouseX, instance.mouseY])
  gl.uniform3fv(programInfo.uniformLocations.bins, [0.1, 0.1, 0.1])

  {
    const offset = 0
    const vertexCount = 4
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount)
  }
}

// Initialize a shader program
const initShaderProgram = (gl, vsSource, fsSource) => {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource)
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)

  const shaderProgram = gl.createProgram()
  gl.attachShader(shaderProgram, vertexShader)
  gl.attachShader(shaderProgram, fragmentShader)
  gl.linkProgram(shaderProgram)

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram))
    return null
  }

  return shaderProgram
}

const loadShader = (gl, type, source) => {
  const shader = gl.createShader(type)

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }

  return shader
}

const resizeCanvas = (instance) => {
  if (instance.$refs) {
    const canvas = instance.$refs.glCanvas
    if (canvas && instance.image) {
      const image = instance.$slots.default[0].elm
      const rect = image.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
    }
  }
}

const updateMousePosition = (e, instance) => {
  const rect = e.target.getBoundingClientRect()
  instance.mouseX = (e.clientX - rect.left) / rect.width
  instance.mouseY = (rect.bottom - e.clientY) / rect.height
}

// ////////////////////////////////////////////////////////////////////// Export
export default {
  name: 'Shader',

  data () {
    return {
      mouseX: 0.5,
      mouseY: 0.5,
      resize: false
    }
  },

  props: {
    throb: {
      type: Number,
      required: false,
      default: 0.1
    }
  },

  computed: {
    image () {
      if (!!this.$slots.default && this.$slots.default[0].elm.tagName === 'IMG') {
        return this.$slots.default[0].elm
      }
      return false
    },
  },

  mounted () {
    this.$nextTick(() => {
      this.resize = Throttle(() => { resizeCanvas(this) }, 250)
      window.addEventListener('resize', this.resize)

      requestAnimationFrame(() => { initWebglCanvas(this) })
    })
  },

  beforeDestroy () {
    if (this.resize) { window.removeEventListener('resize', this.resize) }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.canvas-container {
  position: relative;
}

.glCanvas {
  position: relative;
}
</style>
