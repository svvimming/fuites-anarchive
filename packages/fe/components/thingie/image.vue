<template>
  <v-group>

    <v-group
      v-if="clipActive"
      ref="clipGroup"
      :config="groupConfig">
      <v-image :config="clipConfig" />
    </v-group>
    
    <v-image
      ref="imgNode"
      :config="imageConfig" :key="key" />

  </v-group>
</template>

<script setup>
// ======================================================================= Props
const props = defineProps({
  fileRef: {
    type: Object,
    required: true
  },
  parentConfig: {
    type: Object,
    required: true
  },
  options: {
    type: Object,
    required: false,
    default: () => ({})
  },
  clipActive: {
    type: Boolean,
    required: false,
    default: false
  },
  path: {
    type: String,
    required: false,
    default: ''
  }
})

const emit = defineEmits(['loaded'])

// ======================================================================== Data
const image = ref(false)
const canvas = ref(false)
const clipPath = ref(false)
const clipGroup = ref(null)
const clipGroupVisible = ref(false)
const imgNode = ref(null)
const generalStore = useGeneralStore()
const { baseUrl } = storeToRefs(generalStore)
const key = ref(0)

// ==================================================================== Computed
const imageConfig = computed(() => ({
  thingie_id: props.parentConfig.thingie_id,
  width: props.parentConfig.width,
  height: props.parentConfig.height,
  image: props.clipActive && canvas.value ? canvas.value : image.value,
  ...props.options
}))

const clipConfig = computed(() => ({
  width: props.parentConfig.width,
  height: props.parentConfig.height,
  image: image.value
}))

const groupConfig = computed(() => ({
  ...(clipPath.value && { clipFunc: () => [new Path2D(clipPath.value), 'evenodd'] }),
  visible: clipGroupVisible.value
}))

// ==================================================================== Watchers
watch(() => props.options, () => { key.value++ }, { deep: true })
watch(() => imageConfig.value, () => { drawImageThingieHitArea() })
watch(() => props.clipActive, (val) => {
  if (val && !canvas.value) {
    nextTick(() => { applyClipPath() })
  }
})

// ===================================================================== Methods
/**
 * @method applyClipPath
 */

const applyClipPath = () => {
  clipPath.value = useGetSvgPath(props.path, {
    closed: true,
    rescale: {
      x: props.parentConfig.width,
      y: props.parentConfig.height
    }
  })
  if (clipPath.value && clipGroup.value) {
    clipGroupVisible.value = true
    nextTick(() => {
      const group = clipGroup.value.getNode()
      canvas.value = group.toCanvas({ pixelRatio: 2 })
      clipGroupVisible.value = false
    })
  }
}

/**
 * @method loadImage
 */

const loadImage = () => {
  const img = document.createElement('img')
  img.crossOrigin = 'Anonymous'
  img.onload = function () {
    emit('loaded', true)
    image.value = img
    if (props.clipActive) {
      nextTick(() => { applyClipPath() })
    }
  }
  img.onerror = function () {
    emit('loaded', true)
  }
  img.src = baseUrl.value.startsWith('https://localhost') ?
    `${baseUrl.value}/uploads/${props.fileRef._id}.${props.fileRef.file_ext}` : props.fileRef.file_url
}

/**
 * @method drawImageThingieHitArea 
 */

const drawImageThingieHitArea = () => {
  nextTick(() => {
    if (imgNode.value && !baseUrl.value.startsWith('https://localhost')) {
      imgNode.value.getNode().cache()
      imgNode.value.getNode().drawHitFromCache()
    }
  })
}

// ======================================================================= Hooks
onMounted(() => {
  loadImage()
  drawImageThingieHitArea()
})

</script>
