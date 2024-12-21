<template>
  <div
    v-if="textEditor"
    :class="['font-family-selector', { expanded }]">

    <div v-if="expanded" class="options">

      <button
        v-for="(size, i) in sizes"
        :key="size"
        :class="[
          'font-size-button',
          `position-${i + 1}`,
          { selected: textEditor.isActive('textStyle', { fontSize: size }) }
        ]"
        :style="{
          transform: `translate(${Math.cos((Math.PI / 3) * (i - 3.5)) * 125}%, ${Math.sin((Math.PI / 3) * (i - 3.5)) * 125}%)`
        }"
        @click="setSelectionFontSize(size)">
        {{ size }}
      </button>

      <input
        type="number"
        v-model="custom"
        class="custom-input" />

    </div>

    <button v-else class="collapsed">
      <span>size</span>
    </button>

  </div>
</template>

<script setup>
// ======================================================================= Props
defineProps({
  expanded: {
    type: Boolean,
    required: false,
    default: false
  }
})

// ======================================================================== Data
const verseStore = useVerseStore()
const { textEditor } = storeToRefs(verseStore)

const sizes = ['13pt', '16pt', '20pt', '24pt', '32pt']
const custom = ref(16)

watch(custom, (val) => {
  const size = val + 'pt'
  setSelectionFontSize(size)
})

// ===================================================================== Methods
/**
 * @method setSelectionFontSize
 */

const setSelectionFontSize = size => {
  textEditor.value.chain().focus().setFontSize(size).run()
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.font-family-selector {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  border: solid 0.5px $woodsmoke;
  background-color: white;
  width: torem(40);
  height: torem(40);
  overflow: scroll;
  transition: 200ms ease;
  &.expanded {
    width: torem(100);
    height: torem(100);
  }
}

.options {
  position: relative;
  width: 25%;
  height: 25%;
  background-color: white;
}

.font-size-button {
  position: absolute;
  color: $woodsmoke;
  padding: torem(3) torem(4);
  font-size: torem(8);
  border-radius: 50%;
  width: 100%;
  height: 100%;
  &.selected {
    background-color: $salt;
    color: white;
  }
}

.custom-input {
  position: absolute;
  width: calc(100% + torem(6));
  height: 100%;
  border: solid 0.5px $woodsmoke;
  color: $woodsmoke;
  font-size: torem(8);
  transform: translate(torem(-3), 125%);
  border-radius: torem(3);
}

.collapsed {
  color: $woodsmoke;
}
</style>
