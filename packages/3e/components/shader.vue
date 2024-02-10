<template>
  <div class="canvas-container">

    <img
      ref="sampler"
      :src="image.src"
      :width="image.width"
      :height="image.height"
      class="sampler-image" />

    <canvas class="glCanvas" ref="glCanvas"></canvas>

  </div>
</template>

<script>
// ///////////////////////////////////////////////////////////////////// Imports
import Throttle from 'lodash/throttle'

import vertexShaderSource from '@/assets/glsl/cull.vert'
import fragmentShaderSource from '@/assets/glsl/cull.frag'

import Irridescence from '@/components/irridescence'

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
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord")
    },
    uniformLocations: {
      resolution: gl.getUniformLocation(shaderProgram, 'u_resolution'),
      time: gl.getUniformLocation(shaderProgram, 'u_time'),
      level: gl.getUniformLocation(shaderProgram, 'u_level'),
      pulse: gl.getUniformLocation(shaderProgram, 'u_pulse'),
      mouse: gl.getUniformLocation(shaderProgram, 'u_mouse'),
      uSampler: gl.getUniformLocation(shaderProgram, "uSampler")
    }
  }
  const buffers = initBuffers(gl)
  const texture = loadTexture(gl, instance)
  let fps, fpsInterval, startTime, now, then, elapsed, i = 0;

  function startAnimating(fps) {
    fpsInterval = 1000 / fps
    then = Date.now()
    startTime = then
    render()
  }

  function render () {
    requestAnimationFrame(render)
    now = Date.now()
    elapsed = now - then
    drawScene(instance, gl, programInfo, buffers, texture, i)
    i += 0.00667
    if (elapsed > fpsInterval) {
      then = now - (elapsed % fpsInterval)
      drawScene(instance, gl, programInfo, buffers, texture, i)
      i += 0.00667
    }
  }

  startAnimating(30)
}

// ////////////////////////////////////////////////////////// Initialize buffers
// ========================================================================== //
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

  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  const textureCoordinates = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(textureCoordinates),
    gl.STATIC_DRAW
  );
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  const indices = [0, 1, 2, 3, 2, 3]

  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  return {
    position: positionBuffer,
    textureCoord: textureCoordBuffer,
    indices: indexBuffer,
  };
}

// //////////////////////////////////////////////////////////////// Load Texture
// ========================================================================== //
const loadTexture = (gl, instance) => {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([255, 255, 255, 255]);  // opaque white
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);
  const image = instance.$refs.sampler;
  const handleImageLoad = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
       gl.generateMipmap(gl.TEXTURE_2D);
    } else {
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
  }
  handleImageLoad()
  image.onload = () => { handleImageLoad() }
  return texture;
}

const isPowerOf2 = (value) => {
  return (value & (value - 1)) === 0;
}

// ////////////////////////////////////////////////////////////////// Draw Scene
// ========================================================================== //
const drawScene = (instance, gl, programInfo, buffers, texture, time) => {
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.clearDepth(1.0)
  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute
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
  // Tell WebGL how to pull out the texture coordinates from
  // the texture coordinate buffer into the textureCoord attribute.
  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(
      programInfo.attribLocations.textureCoord,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
  }
  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);
  // Set shader uniforms
  gl.uniform2fv(programInfo.uniformLocations.resolution, [gl.canvas.width, gl.canvas.height])
  gl.uniform1f(programInfo.uniformLocations.time, time)
  gl.uniform1f(programInfo.uniformLocations.level, instance.level)
  gl.uniform1f(programInfo.uniformLocations.pulse, instance.pulse)
  gl.uniform2fv(programInfo.uniformLocations.mouse, [instance.mouseX, instance.mouseY])
  // Specify the texture to map onto the faces.
  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0);
  {
    const offset = 0
    const vertexCount = 4
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount)
  }
}

// ///////////////////////////////////////////////// Initialize a shader program
// ========================================================================== //
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

// ///////////////////////////////////////////////////////// Load shader program
// ========================================================================== //
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

// ///////////////////////////////////////////////////////////// Event Listeners
// ========================================================================== //
const resizeCanvas = (instance) => {
  if (instance.$refs.glCanvas && instance.$refs.sampler) {
    const canvas = instance.$refs.glCanvas
    // const image = instance.$refs.sampler
    // const rect = image.getBoundingClientRect()
    canvas.width = instance.image.width
    canvas.height = instance.image.height
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

  components: {
    Irridescence
  },

  data () {
    return {
      mouseX: 0.5,
      mouseY: 0.5,
      resize: false
    }
  },

  props: {
    image: {
      type: Object,
      required: true,
      default: () => ({})
    },
    pulse: {
      type: Number,
      required: false,
      default: 0.3
    },
    audioInput: {
      type: Number,
      required: false,
      default: 0
    },
    exposure: {
      type: Number,
      required: false,
      default: 1.0
    }
  },

  computed: {
    level () {
      if (this.audioInput) { return this.audioInput }
      return this.exposure
    }
  },

  mounted () {
    this.$nextTick(() => {
      this.resize = Throttle(() => { resizeCanvas(this) }, 250)
      window.addEventListener('resize', this.resize)
      if (this.$refs.sampler) {
        requestAnimationFrame(() => { initWebglCanvas(this) })
      }
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

.sampler-image {
  position: absolute;
}

.glCanvas {
  position: relative;
}

.sampler-image {
  opacity: 0;
}

:deep(.turbulence-bg) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  opacity: 0.66;
}
</style>
