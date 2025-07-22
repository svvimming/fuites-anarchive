<template>
  <div class="pocket-carousel-container">
    <!-- --------------------------------------------------- Carousel Canvas -->
    <div
      id="pocket-carousel"
      ref="carouselRef">
      <ClientOnly>
        <v-stage ref="stageRef" :config="carouselConfig">
          <v-layer>
            <v-group
              ref="carouselGroupRef"
              :config="{ x: carouselConfig.width * 0.5, y: 0 }">
              <template
                v-for="thingie in orderedThingies"
                :key="thingie._id">
                <v-group
                  ref="thingieRefs"
                  :config="{
                    _id: thingie._id,
                    x: 0,
                    y: ids.indexOf(thingie._id) * thingieHeight * spacingRatio - (thingieHeight * 0.5),
                    offsetX: getThingieOffsetX(thingie),
                    offsetY: thingieHeight * 0.5
                  }">

                  <ThingieImage
                    v-if="thingie.thingie_type === 'image'"
                    :file-ref="thingie.file_ref"
                    :parent-config="getParentConfig(thingie)"
                    :clip-active="thingie.clip"
                    :path="thingie.path_data" />

                  <ThingieSound
                    v-if="thingie.thingie_type === 'sound'"
                    :file-ref="thingie.file_ref"
                    :parent-config="getParentConfig(thingie)"
                    :gain="thingie.gain || 1"
                    :path="thingie.path_data"
                    :colors="thingie.colors"
                    :position="thingie.at"
                    :location="thingie.location"
                    :stroke-width="thingie.stroke_width"
                    :force-opacity="1" />

                  <ThingieText
                    v-if="thingie.thingie_type === 'text'"
                    :text="thingie.text"
                    :link="thingie.link || ''"
                    :parent-config="getParentConfig(thingie)" />

                </v-group>
              </template>
            </v-group>
          </v-layer>
        </v-stage>
      </ClientOnly>
    </div>
    <!-- -------------------------------------------------- Thingie Controls -->
    <ButtonIcon
      :class="['close-button']"
      @clicked="pocketStore.setPocketOpen(false)">
      <IconClose />
    </ButtonIcon>

    <ButtonIcon
      :class="['compost-button']"
      @clicked="sendThingieToCompost">
      <IconRecycle />
    </ButtonIcon>

    <ButtonBasic
      :class="['page-button']"
      @clicked="sendThingieToPage">
      <span class="move-to">move to</span>
      <span class="page-name">{{ page.data?.name }}</span>
    </ButtonBasic>

    <ButtonBasic
      :class="['audio-button', { visible: audioButtonVisible }]"
      @clicked="handleAudioClick">
      <span class="audio-text">preview sound</span>
      <IconAudio class="audio-icon" />
    </ButtonBasic>

  </div>
</template>

<script setup>
// ===================================================================== Imports
import { useThrottleFn } from '@vueuse/core'
import { useSwipe } from '@vueuse/core'

// ======================================================================= Props
const props = defineProps({
  pocketThingies: {
    type: Array,
    required: true
  }
})

// ======================================================================== Data
const collectorStore = useCollectorStore()
const pocketStore = usePocketStore()
const verseStore = useVerseStore()
const { sceneData, page } = storeToRefs(verseStore)
const { createNewPageFromThingie } = useCreatePageFromThingie()
const carouselRef = ref(null)
const thingieRefs = ref(null)
const stageRef = ref(null)
const ordered = ref([])
const centerIndex = ref(0)
const carouselGroupRef = ref(null)
const carouselGroupOffset = ref(0)
const thingieWidth = 100
const thingieHeight = 100
const resizeEventListener = ref(null)
const { isSwiping, direction } = useSwipe(carouselRef)
const carouselConfig = ref({
  width: 300,
  height: 500
})
const spacingRatio = 1.0

// ==================================================================== Computed
const ids = computed(() => props.pocketThingies.map(thingie => thingie._id))
const orderedThingies = computed(() => ordered.value.map(id => props.pocketThingies.find(thingie => thingie._id === id)))
const audioButtonVisible = computed(() => props.pocketThingies[centerIndex.value]?.thingie_type === 'sound')

// ==================================================================== Watchers
watch(() => props.pocketThingies, () => {
  centerIndex.value = Math.floor(ids.value.length / 2)
  animateSlides(centerIndex.value)
})

watch(isSwiping, (val) => {
  if (val) {
    if (direction.value === 'up') {
      handleSwipe(1)
    } else if (direction.value === 'down') {
      handleSwipe(-1)
    }
  }
})

watch(centerIndex, index => { animateSlides(index) })

// ===================================================================== Methods
/**
 * @method handleSwipe
 */

const handleSwipe = dir => {
  if (dir === 1) {
    centerIndex.value = Math.min(ids.value.length - 1, centerIndex.value + 1)
  } else {
    centerIndex.value = Math.max(0, centerIndex.value - 1)
  }
}

/**
 * @method sendThingieToPage
 */

const sendThingieToPage = () => {
  const thingie = props.pocketThingies[centerIndex.value]
  const at = Object.assign({}, thingie.at, {
    x: -1 * sceneData.value.x + (window.innerWidth * 0.5) / sceneData.value.scale,
    y: -1 * sceneData.value.y + (window.innerHeight * 0.5) / sceneData.value.scale
  })
  if (page.value.data?.name) {
    collectorStore.initThingieUpdate({
      _id: thingie._id,
      location: page.value.data.name,
      record_new_location: true,
      at
    }, true)
    // handle page creation functions
    if (page.value.data?.state === 'metastable') {
      createNewPageFromThingie(thingie, at)
    }
  }
}


/**
 * @method sendThingieToCompost
 */

const sendThingieToCompost = () => {
  const thingie = props.pocketThingies[centerIndex.value]
  const at = Object.assign({}, thingie.at, {
    x: Math.random() * (2732 - thingie.at.width) + (0.5 * thingie.at.width),
    y: Math.random() * (2000 - thingie.at.height) + (0.5 * thingie.at.height)
  })
  collectorStore.initThingieUpdate({
    _id: thingie._id,
    location: 'compost',
    record_new_location: true,
    at
  }, true)
}

/**
 * @method handleAudioClick
 */

const handleAudioClick = () => {
  console.log('handleAudioClick')
}

/**
 * @method animateSlides
 */

const animateSlides = center => {
  const reordered = []
  const els = ids.value

  const maxDif = Math.max(center, els.length - center)
  for (let i = 0; i < maxDif + 1; i++) {
    if (els[center + i]) {
      reordered.push(els[center + i])
    }
    if (i !== 0 && els[center - i]) {
      reordered.push(els[center - i])
    }
  }
  ordered.value = reordered.reverse()

  const group = carouselGroupRef.value.getNode()
  carouselGroupOffset.value = (-1 * center * thingieHeight * spacingRatio) + (0.5 * thingieHeight * spacingRatio) + (window.innerHeight * 0.5)
  group.to({
    y: carouselGroupOffset.value,
    duration: 0.20,
    easing: Konva.Easings.EaseInOut
  })
  nextTick(() => {
    if (thingieRefs.value) {
      const center = centerIndex.value
      for (let i = 0; i < thingieRefs.value.length; i++) {
        const node = thingieRefs.value[i].getNode()
        const id = node.attrs._id
        if (id === els[center]) {
          node.to({
            scaleX: 2.1,
            scaleY: 2.1,
            opacity: 1,
            duration: 0.20,
            easing: Konva.Easings.EaseInOut
          })
        } else if (id === els[center + 1]) {
          node.to({
            scaleX: 1.5,
            scaleY: 1.5,
            opacity: 0.33,
            duration: 0.20,
            easing: Konva.Easings.EaseInOut
          })
        } else if (id === els[center - 1]) {
          node.to({
            scaleX: 1.5,
            scaleY: 1.5,
            opacity: 0.33,
            duration: 0.20,
            easing: Konva.Easings.EaseInOut
          })
        } else if (id === els[center + 2]) {
          node.to({
            scaleX: 1,
            scaleY: 1,
            opacity: 0.1,
            duration: 0.20,
            easing: Konva.Easings.EaseInOut
          })
        } else if (id === els[center - 2]) {
          node.to({
            scaleX: 1,
            scaleY: 1,
            opacity: 0.1,
            duration: 0.20,
            easing: Konva.Easings.EaseInOut 
          })
        } else {
          node.to({
            scaleX: 0.5,
            scaleY: 0.5,
            opacity: 0,
            duration: 0.20,
            easing: Konva.Easings.EaseInOut
          })
        }
      }
    }
  })
}

/**
 * @method getCarouselConfig
 */

const getCarouselConfig = useThrottleFn(() => {
  carouselConfig.value.width = Math.max(window.innerWidth, 300)
  carouselConfig.value.height = Math.max(window.innerHeight, 500)
}, 50)

/**
 * @method getParentConfig
 */

const getParentConfig = thingie => {
  const width = thingie.at.width
  const height = thingie.at.height
  return {
    width: thingieWidth * (width / height),
    height: thingieHeight,
    thingie_id: thingie._id
  }
}

/**
 * @method getThingieOffsetX
 */

const getThingieOffsetX = thingie => {
  const width = thingie.at.width
  const height = thingie.at.height
  return thingieWidth * (width / height) * 0.5
}

// ======================================================================= Hooks
onMounted(() => {
  // Register the resize event listener
  resizeEventListener.value = () => { getCarouselConfig() }
  window.addEventListener('resize', resizeEventListener.value)
  nextTick(() => {
    centerIndex.value = Math.floor(ids.value.length / 2)
    animateSlides(centerIndex.value)
    // Get the initial pocket canvas config
    setTimeout(() => {
      getCarouselConfig()
    }, 500)
  })
})

onBeforeUnmount(() => {
  if (resizeEventListener.value) {
    window.removeEventListener('resize', resizeEventListener.value)
  }
})

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.pocket-carousel-container {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
}

#pocket-carousel {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  touch-action: pan-y;
}

.close-button {
  position: absolute;
  left: torem(12);
  top: torem(12);
}

.compost-button {
  --two-tone-a: #{$kellyGreen} !important;
  --two-tone-b: white;
  position: absolute;
  left: torem(12);
  bottom: torem(12);
  :deep(path) {
    stroke: var(--two-tone-a);
  }
  &.active {
    transform: none;
    :deep(path) {
      stroke: var(--two-tone-b);
    }
  }
}

.page-button {
  position: absolute;
  padding: torem(10) torem(16);
  left: 50%;
  bottom: torem(12);
  transform: translateX(-50%);
  border-radius: torem(35);
  background-color: #{$billyBlue};
  // overflow: hidden;
  // text-overflow: ellipsis;
  white-space: nowrap;
  &:before {
    display: none;
  }
  :deep(.slot) {
    display: flex;
    align-items: center;
  }
  .move-to {
    display: inline-block;
    overflow: hidden;
  }
  .page-name {
    display: inline-block;
    margin-left: torem(4);
    font-style: italic;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: torem(130);
  }
}

.audio-button {
  position: absolute;
  left: 50%;
  top: torem(12);
  transform: translateX(-50%);
  border-radius: torem(35);
  background-color: transparent;
  opacity: 0;
  visibility: hidden;
  transition: 150ms ease;
  &.visible {
    opacity: 1;
    visibility: visible;
    transition: 150ms ease;
  }
  &:before {
    display: none;
  }
  :deep(.slot) {
    display: flex;
    align-items: center;
  }
  .audio-text {
    font-size: torem(12);
    color: white;
  }
  .audio-icon {
    width: torem(14);
    height: torem(14);
    margin-left: torem(4);
    :deep(path) {
      stroke: white;
    }
  }
}
</style>
