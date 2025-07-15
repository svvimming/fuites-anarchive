<template>
  <div :class="['caddy-mobile', { active: thingie }]">
    
    <div class="tool-slider" :style="{ transform: `translateX(${sliderX}px)` }">
      
      <div
        v-for="tool in tools"
        :key="tool"
        class="tool-slide"
        @click="handleToolClick(tool)">
        {{ tool }}
      </div>

    </div>

  </div>
</template>

<script setup>
// ======================================================================== Data
const collectorStore = useCollectorStore()
const { thingies, editing } = storeToRefs(collectorStore)
const pocketStore = usePocketStore()
const { pocket } = storeToRefs(pocketStore)
const verseStore = useVerseStore()
const { page, textEditor, colorSelectorHex } = storeToRefs(verseStore)

const soundThingieData = ref({})
const initAngle = ref(0)
const selected = ref('d')
const imageTools = [
  'layer-opacity',
  'rotation',
  'resize',
  'clip-toggle'
]
const textTools = [
  'layer-opacity',
  'rotation',
  'font-editor',
  'color-selector'
]
const soundTools = [
  'layer-opacity',
  'rotation',
  'resize',
  'color-selector',
  'volume'
]

// ==================================================================== Computed
const thingie = computed(() => thingies.value.data.find(item => item._id === editing.value))
const pageThingies = computed(() => thingies.value.data.filter(item => item.location === page.value?.data?.name))
const pocketThingies = computed(() => thingies.value.data.filter(item => item.location === 'pocket' && item.pocket_ref === pocket.value.data?._id))
const type = computed(() => thingie.value?.thingie_type)
const colors = computed(() => thingie.value.colors)
const thingieColor = computed(() => colors.value[colors.value.length - 1])
const tools = computed(() => ['a', 'b', 'c', 'd', 'e', 'f', 'g']) // type.value === 'image' ? imageTools : type.value === 'text' ? textTools : soundTools)
const sliderX = computed(() => tools.value.indexOf(selected.value) * -48)

// ==================================================================== Watchers
watch(() => thingie.value?._id, (newId, oldId) => {
  // Update closed sound thingie with saved hex color
  if (oldId && soundThingieData.value._id === oldId && colorSelectorHex.value.sound) {
    collectorStore.initThingieUpdate({
      _id: oldId,
      colors: soundThingieData.value.colors.concat(colorSelectorHex.value.sound)
    })
  }
  // reset sound thingie data
  if (soundThingieData.value._id) { soundThingieData.value = {} }
  // Reset selector hex for new sound thingie being edited
  if (newId && thingie.value.thingie_type === 'sound') {
    verseStore.setColorSelectorHex({ sound: '' })
    soundThingieData.value = {
      _id: newId,
      colors: [...thingie.value.colors]
    }
  }
  if (newId) {
    initAngle.value = thingie.value.at.rotation
    // handleToolClick('handle')
    // resetPositions()
  }
})

// ==================================================================== Methods
const handleToolClick = (tool) => {
  selected.value = tool
}

</script>

<style lang="scss" scoped>
.caddy-mobile {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: torem(98);
  background-color: $stormGray;
  z-index: 3;
  visibility: hidden;
  opacity: 0;
  &.active {
    visibility: visible;
    opacity: 1;
  }
}

.tool-slider {
  position: absolute;
  left: calc(50% - torem(24)); // half of container width minus half of one slide width
  top: calc(50% - torem(24)); // half of container height minus half of one slide height
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease-in-out;
}

.tool-slide {
  display: flex;
  align-items: center;
  justify-content: center;
  width: torem(48);
  height: torem(48);
  color: white;
}
</style>
