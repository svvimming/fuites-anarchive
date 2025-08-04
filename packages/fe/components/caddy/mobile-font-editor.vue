<template>
  <div class="mobile-font-editor">
    <!-- ======================================================== Background -->
    <SvgCaddyMobileFontEditorBackground class="mobile-font-editor-background" />
    <!-- ===================================================== Font Families -->
    <div class="font-families">
      <DropdownSelector
        ref="dropdownRef"
        default-option="Nanum"
        :display-selected="true"
        class="font-family-selector">
        <template #toggle-button="{ togglePanel, panelOpen, selected }">
          <button
            :class="['family-list-toggle', getSelectedLabelFamily(selected), { open: panelOpen }]"
            @click="togglePanel">
            <span class="label">{{ selected }}</span>
          </button>
        </template>
        <template #dropdown-panel="{ setSelected, isSelected }">
          <button
            v-for="family in fonts"
            :key="family.display"
            :class="['family-button', { active: isSelected(family.display) }]"
            @click="() => { setSelected(family.display); setSelectionFontFamily(family) }">
            <span :class="['label', family.class]">{{ family.display }}</span>
          </button>
        </template>
      </DropdownSelector>
      <div class="font-size-indicator">
        <input
          v-model="fontsize"
          type="number"
          pattern="[0-9]*"
          class="input" />
      </div>
    </div>
    <!-- ======================================================= Font Styles -->
    <div class="font-styles">
      <button
        :class="['style-button']"
        @click="handleIncrementFontSize(1)">
        <IconMobileFontIncrease />
      </button>
      <button
        :class="['style-button']"
        @click="handleIncrementFontSize(-1)">
        <IconMobileFontDecrease />
      </button>
      <button
        :class="['style-button', 'toggle-italic', { 'style-active': textEditor.isActive('em') }]"
        @click="textEditor.chain().focus().toggleItalic().run()">
        <IconMobileItalic />
      </button>
      <button
        :class="['style-button', 'toggle-bold', { 'style-active': textEditor.isActive('strong') }]"
        @click="textEditor.chain().focus().toggleBold().run()">
        <IconMobileBold />
      </button>
      <button
        :class="['style-button', 'toggle-underline']"
        @click="textEditor.chain().focus().toggleUnderline().run()">
        <IconMobileUnderline />
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

const dropdownRef = ref(null)
const fontsize = ref('16')
const sizeMin = 1
const sizeMax = 500

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

/**
 * @method handleIncrementFontSize
 */

 const handleIncrementFontSize = val => {
  const pt = Math.min(Math.max(sizeMin, parseInt(fontsize.value) + val), sizeMax)
  fontsize.value = pt.toString()
  setSelectionFontSize(pt + 'px')
}

/**
 * @method setSelectionFontSize
 */

 const setSelectionFontSize = string => {
  textEditor.value.chain().focus().setFontSize(string).run()
}

const getSelectionAttributes = () => {
  const attrs = textEditor.value.getAttributes('textStyle')
  fontsize.value = attrs.hasOwnProperty('fontSize') ? attrs.fontSize.replace('px', '') : '16'
  const family = attrs.hasOwnProperty('fontFamily') ? attrs.fontFamily : 'PT Serif, serif'
  const match = fonts.value.find(item => item.fontFaceDeclaration === family || item.styleAttribute === family)
  if (dropdownRef.value && match) {
    dropdownRef.value.setSelected(match.display)
  }
}

/**
 * @method getSelectedLabelFamily
 */

const getSelectedLabelFamily = display => {
  const family = fonts.value.find(item => item.display === display)
  return family?.class || ''
}

// ======================================================================= Hooks
onMounted(() => {
  textEditor.value.on('selectionUpdate', ({ editor }) => {
    getSelectionAttributes()
  })
})
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.mobile-font-editor {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  touch-action: none;
}

.mobile-font-editor-background {
  position: absolute;
  top: 0;
  left: 50%;
  transform-origin: center top;
  transform: translateX(-50%) scale(1.124);
  width: torem(344);
  height: torem(82);
}

// /////////////////////////////////////////////////////////////// Font Families
.font-families {
  position: relative;
  display: flex;
  justify-content: center;
  z-index: 2;
  margin: torem(8) 0;
}

.font-family-selector {
  min-width: torem(140);
  height: torem(26);
  margin-right: torem(8);
}

.family-list-toggle {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: $shark;
  border-radius: torem(4);
  box-shadow: inset 0px 1px 1px rgba(0, 0, 0, 0.3), 1px 1px 1px rgba(#949DB8, 1.0), -1px -1px 1px rgba(#454956, 0.8);
  transition: 150ms ease;
  &:hover {
    background-color: #3f424d;
  }
  &:before {
    content: '';
    position: absolute;
    left: torem(5);
    top: calc(50% + torem(1));
    width: torem(8);
    height: torem(4);
    transform: translateY(-50%);
    transition: 200ms ease;
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg width='8' height='4' viewBox='0 0 8 4' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M0.126709 0.0422363L3.78868 3.56336L7.45065 0.0422363H0.126709Z' fill='white'/%3e%3c/svg%3e");
  }
  &.open {
    &:before {
      transform: translateY(calc(-50% + torem(-1))) rotate(180deg);
    }
  }
}

:deep(.panel-container) {
  width: 100%;
}

:deep(.panel) {
  width: 100%;
  background-color: $shark;
  border-radius: torem(4);
  overflow: hidden;
}

.family-list-toggle,
.family-button {
  display: flex;
  justify-content: center;
  align-items: center;
  .label {
    color: white;
    font-size: torem(10);
    font-weight: 400;
    line-height: 1.5;
    white-space: nowrap;
    -webkit-user-select: none; /* Safari */
    -ms-user-select: none; /* IE 10 and IE 11 */
    user-select: none; /* Standard syntax */
    @include small {
      font-size: torem(14);
    }
  }
}

.family-button {
  padding: torem(2) 0;
  width: 100%;
  transition: 150ms;
  @include small {
    padding: torem(6) 0;
  }
  &.active {
    background-color: rgba(255, 255, 255, 0.1);
  }
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
}

.font-size-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  width: torem(36);
  height: torem(26);
  background-color: $shark;
  border-radius: torem(4) torem(7) torem(4) torem(4);
  box-shadow: inset 0px 1px 1px rgba(0, 0, 0, 0.3), 1px 1px 1px rgba(#949DB8, 1.0), -1px -1px 1px rgba(#454956, 0.8);
  .input {
    width: 100%;
    color: white;
    font-size: torem(12);
    font-family: 'Source Code Pro';
    font-weight: 600;
    line-height: 1;
    text-align: center;
    pointer-events: none;
  }
}

// ///////////////////////////////////////////////////////////////// Font Styles
.font-styles {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.style-button {
  &:not(:last-child) {
    margin-right: torem(5);
  }
}
</style>
