<template>
  <div
    v-if="textEditor"
    :class="['font-family-selector', { expanded }]">

    <div v-if="expanded" class="options">
      <button
        v-for="font in fonts"
        :key="font.class"
        :class="[
          'font-family-button',
          font.class,
          { selected: textEditor.isActive('textStyle', { fontFamily: font.fontFaceDeclaration }) }
        ]"
        @click="setSelectionFontFamily(font)">
        {{ font.display }}
      </button>
    </div>

    <button v-else class="collapsed">
      <span>fonts</span>
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
const generalStore = useGeneralStore()
const { siteData } = storeToRefs(generalStore)
const verseStore = useVerseStore()
const { textEditor } = storeToRefs(verseStore)

// ==================================================================== Computed
const fonts = computed(() => siteData.value?.settings?.fonts || [])

// ===================================================================== Methods
/**
 * @method setSelectionFontFamily
 */

const setSelectionFontFamily = font => {
  const declaration = font.fontFaceDeclaration
  textEditor.value.chain().focus().setFontFamily(declaration).run()
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.font-family-selector {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-radius: 50%;
  border: solid 0.5px $woodsmoke;
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
  display: flex;
  flex-direction: column;
  padding: torem(16) 0;
}

.font-family-button {
  color: white;
  padding: torem(3) torem(4);
  font-size: torem(8);
  &.selected {
    background-color: $salt;
    color: white;
  }
}

.collapsed {
  color: white;
}
</style>
