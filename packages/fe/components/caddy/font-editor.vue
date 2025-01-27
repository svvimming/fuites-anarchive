<template>
  <div class="font-editor">
      
    <div class="font-options">
      <!-- --------------------------------------------------- Font Styles -->
      <button
        :class="['arc-button', 'font-style-button', 'toggle-underline']"
        :style="getArcButtonTransform(0)"
        @click="textEditor.chain().focus().toggleUnderline().run()">
        U
      </button>
      <button
        :class="['arc-button', 'font-style-button', 'toggle-italic', { 'style-active': textEditor.isActive('em') }]"
        :style="getArcButtonTransform(1)"
        @click="textEditor.chain().focus().toggleItalic().run()">
        I
      </button>
      <button
        :class="['arc-button', 'font-style-button', 'toggle-bold', { 'style-active': textEditor.isActive('strong') }]"
        :style="getArcButtonTransform(2)"
        @click="textEditor.chain().focus().toggleBold().run()">
        B
      </button>
      <!-- ---------------------------------------------------- Font Sizes -->
      <button
        v-for="(size, i) in sizes"
        :key="size"
        :class="[
          'arc-button',
          'font-size-button',
          `position-${i + 1}`,
          { 'size-active': textEditor.isActive('textStyle', { fontSize: size + 'px' }) }
        ]"
        :style="getArcButtonTransform(i + 3)"
        @click="setSelectionFontSize(size)">
        <span class="number">{{ size }}</span>
        <span class="point">pt</span>
      </button>
      <!-- ---------------------------------------------- Size Incrementor -->
      <button @click="handleIncrement">
        +
      </button>
      <span>
        size
      </span>
      <button>
        -
      </button>

    </div>
    <!-- --------------------------------------------------- Font Families -->
    <div class="font-families">
      <button
        v-for="font in fonts"
        :key="font.class"
        :class="[
          'font-family-button',
          font.class,
          { 'style-active': textEditor.isActive('textStyle', { fontFamily: font.fontFaceDeclaration }) }
        ]"
        @click="setSelectionFontFamily(font)">
        {{ font.display }}
      </button>
    </div>

  </div>
</template>

<script setup>
// ======================================================================== Data
const generalStore = useGeneralStore()
const { siteData } = storeToRefs(generalStore)
const verseStore = useVerseStore()
const { textEditor } = storeToRefs(verseStore)

const sizes = ['10', '16', '22', '36']

// ==================================================================== Computed
const fonts = computed(() => siteData.value?.settings?.fonts || [])

// ===================================================================== Methods
/**
 * @method setSelectionFontSize
 */

 const setSelectionFontSize = size => {
  textEditor.value.chain().focus().setFontSize(`${size}px`).run()
}

/**
 * @method setSelectionFontFamily
 */

const setSelectionFontFamily = font => {
  const declaration = font.fontFaceDeclaration
  textEditor.value.chain().focus().setFontFamily(declaration).run()
}

/**
 * @method getArcButtonTransform
 */

const getArcButtonTransform = index => {
  const x = Math.cos((Math.PI / 2) + (index * Math.PI / 6)) * 44
  const y = Math.sin((Math.PI / 2) + (index * Math.PI / 6)) * -60
  return {
    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
  }
}

const handleIncrement = () => {
  console.log(textEditor.value.view.state.selection)
}

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.font-editor {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-radius: 0;
  width: torem(152);
  height: torem(152);
}

// /////////////////////////////////////////////////////////////// Font Families
.font-families,
.font-options {
  width: 50%;
}

.font-families {
  // position: absolute;
  height: 80%;
  display: flex;
  flex-direction: column;
  padding-left: torem(6);
  padding-right: torem(4);
  border-left: solid torem(1) rgba(white, 0.8);
  overflow: scroll;
}

.font-family-button {
  color: white;
  padding: 0 torem(2);
  font-size: torem(8);
  text-align: left;
  white-space: nowrap;
  border-radius: torem(2);
  color: rgba(white, 0.8);
  &.style-active {
    background-color: $salt;
    color: white;
  }
}

// //////////////////////////////////////////////////////////////// Font Options
.font-options {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  padding-right: torem(6);
  height: 100%;
}

.arc-button {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 50%;
  right: 0;
  width: torem(22);
  height: torem(20);
  border-radius: torem(2);
  transform: translate(-50%, -50%);
  line-height: 1;
}

.font-style-button {
  font-size: torem(11);
  &.toggle-bold {
    font-weight: 700;
  }
  &.toggle-italic {
    font-style: italic;
  }
  &.toggle-underline {
    text-decoration: underline;
  }
  &.style-active {
    background-color: $salt;
    color: white;
  }
}

.font-size-button {
  &.size-active {
    background-color: $salt;
    color: white;
  }
  .number {
    font-size: torem(11);
  }
  .point {
    font-size: torem(8);
    font-style: italic;
  }
}
</style>
