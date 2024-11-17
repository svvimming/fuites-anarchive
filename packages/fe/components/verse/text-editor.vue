<template>
  <div
    id="text-editor"
    :class="{ active }"
    :style="{
      left: `${at.x - at.width * 0.5 - 4}px`,
      top: `${at.y - at.height * 0.5 - 4}px`
    }">

    <textarea
      ref="textarea"
      v-model="text"
      :class="['textarea']"
      :style="textStyles"
      @keydown.enter="handleSubmit" />

  </div>
</template>

<script setup>
import { nextTick } from 'vue';

// ======================================================================== Data
const collectorStore = useCollectorStore()
const { thingies, editing } = storeToRefs(collectorStore)

const text = ref('')
const thingieId = ref('')
const textarea = ref(null)

// ==================================================================== Computed
const thingie = computed(() => thingies.value.data.find(item => item._id === editing.value))
const active = computed(() => thingie.value && thingie.value.thingie_type === 'text')
const at = computed(() => thingie.value?.at || {})
const textStyles = computed(() => ({}))

// ==================================================================== Watchers
watch(thingie, (item) => {
  if (item && item.thingie_type === 'text') {
    thingieId.value = item._id
    text.value = item.text || ''
  }
})

// ===================================================================== Methods
/**
 * @method handleSubmit
 */

const handleSubmit = () => {
  const width = textarea.value.clientWidth - 8 // minus padding
  const height = textarea.value.clientHeight - 8 // minus padding
  const newAtData = Object.assign({}, at.value, { width, height })
  collectorStore.setEditing(false)
  nextTick(() => {
    update({ text: text.value, at: newAtData })
  })
}

/**
 * @method update
 */

const update = data => {
  collectorStore.initThingieUpdate(Object.assign(data, { _id: thingieId.value }))
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
#text-editor {
  position: absolute;
  display: flex;
  z-index: 1;
  opacity: 0;
  visibility: hidden;
  transform: scale(0.8);
  transition: opacity, 200ms ease, visibility 200ms ease, transform 200ms ease;
  // box-shadow: 0px 0px 10px 2px red;
  border-radius: torem(4);
  &.active {
    opacity: 1;
    visibility: visible;
    transform: scale(1);
  }
}

.textarea {
  padding: torem(4);
  resize: both;
  transition: none;
  background-color: white;
  border-radius: torem(4);
}
</style>
