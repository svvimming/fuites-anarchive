<template>
  <div
    id="pocket-carousel"
    ref="carouselRef">

    <ClientOnly>
      <v-stage ref="stageRef" :config="carouselConfig">
        <v-layer>
          <template
            v-for="thingie in pocketThingies"
            :key="thingie._id">

            <ThingieImage
              v-if="thingie.thingie_type === 'image'"
              :file-ref="thingie.file_ref"
              :parent-config="{ width: 80, height: 80, thingie_id: thingie._id }"
              :clip-active="thingie.clip"
              :path="thingie.path_data"
              @loaded="handleSetLoaded" />

            <ThingieSound
              v-if="thingie.thingie_type === 'sound'"
              :file-ref="thingie.file_ref"
              :parent-config="{ width: 80, height: 80, thingie_id: thingie._id }"
              :gain="thingie.gain || 1"
              :path="thingie.path_data"
              :colors="thingie.colors"
              :position="thingie.at"
              :location="thingie.location"
              :stroke-width="thingie.stroke_width" />

            <ThingieText
              v-if="thingie.thingie_type === 'text'"
              :text="thingie.text"
              :link="thingie.link || ''"
              :parent-config="{ width: 80, height: 80, thingie_id: thingie._id }"
              @loaded="handleSetLoaded" />

          </template>
        </v-layer>
      </v-stage>
    </ClientOnly>

  </div>
</template>

<script setup>
// ===================================================================== Imports

// ======================================================================== Data
const carouselRef = ref(null)
const stageRef = ref(null)
const carouselConfig = ref({
  width: 300,
  height: 300
})

// ======================================================================= Props
const props = defineProps({
  pocketThingies: {
    type: Array,
    required: true
  }
})

const handleSetLoaded = () => {
  console.log('loaded')
}
</script>
