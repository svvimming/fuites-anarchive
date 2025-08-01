<template>
  <div class="font-editor" :style="{ '--parent-radius': `${parentRadius}px` }">
    <!-- ======================================================= Font Styles -->
    <div class="font-styles">
      <button
        :class="['style-button', 'toggle-italic', { 'style-active': textEditor.isActive('em') }]"
        @click="textEditor.chain().focus().toggleItalic().run()">
        <IconItalic />
      </button>
      <button
        :class="['style-button', 'toggle-bold', { 'style-active': textEditor.isActive('strong') }]"
        @click="textEditor.chain().focus().toggleBold().run()">
        <IconBold />
      </button>
      <button
        :class="['style-button', 'toggle-underline']"
        @click="textEditor.chain().focus().toggleUnderline().run()">
        <IconUnderline />
      </button>
    </div>
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
    </div>
    <!-- ======================================================== Font Sizes -->
    <div class="font-sizes">
      <ButtonRetrigger
        class="size-button"
        @retrigger="handleIncrementFontSize(-1)">
        <IconCaddyArcLeft />
        <span class="label">-</span>
      </ButtonRetrigger>
      <div
        class="size-button">
        <IconCaddyArcMiddle />
        <input
          v-model="fontsize"
          type="number"
          pattern="[0-9]*"
          class="input" />
      </div>
      <ButtonRetrigger
        class="size-button"
        @retrigger="handleIncrementFontSize(1)">
        <IconCaddyArcRight />
        <span class="label">+</span>
      </ButtonRetrigger>
    </div>

  </div>
</template>

<script setup>
// ======================================================================= Props
const props = defineProps({
  parentRadius: {
    type: Number,
    required: false,
    default: 70
  }
})

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

/**
 * @method getSelectionAttributes
 */

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
.font-editor {
  --parent-radius: 66px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: calc(var(--parent-radius) * 0.18) 0;
  border-radius: 0;
  width: calc(2 * var(--parent-radius));
  height: calc(2 * var(--parent-radius));
  touch-action: none;
  z-index: 3 !important;
  .style-button {
    &.toggle-italic,
    &.toggle-underline {
      margin-top: calc(var(--parent-radius) * 0.157);
      :deep(svg) {
        width: calc(var(--parent-radius) * 0.46);
        height: calc(var(--parent-radius) * 0.46);
      }
    }
    &.toggle-bold {
      :deep(svg) {
        width: calc(var(--parent-radius) * 0.6);
        height: calc(var(--parent-radius) * 0.3);
      }
    }
  }
  .font-family-selector {
    width: calc(var(--parent-radius) * 1.542);
    height: calc(var(--parent-radius) * 0.257);
  }
  .size-button {
    &:first-child,
    &:last-child {
      margin-bottom: calc(var(--parent-radius) * 0.157);
    }
    :deep(svg) {
      width: calc(var(--parent-radius) * 0.6);
      height: calc(var(--parent-radius) * 0.3);
    }
    &.retrigger-button {
      :deep(svg) {
        width: calc(var(--parent-radius) * 0.46);
        height: calc(var(--parent-radius) * 0.46);
      }
    }
  }
}

.font-styles,
.font-families,
.font-sizes {
  position: relative;
  display: flex;
  justify-content: center;
}

.font-styles,
.font-sizes {
  z-index: 1;
}

.font-families {
  z-index: 2;
}

// ///////////////////////////////////////////////////////////////// Font Styles
.style-button {
  display: flex;
  transition: 150ms ease;
  filter: drop-shadow(0px 1px 1px rgba(#2C2E35, 0.5));
  &:hover {
    transform: scale(1.05);
    filter: drop-shadow(0px 1px 2px rgba(#2C2E35, 0.5));
  }
}

// /////////////////////////////////////////////////////////////// Font Families
.family-list-toggle {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: $shark;
  border-radius: torem(4);
  box-shadow: inset 0px 1px 1px rgba(0, 0, 0, 0.3);
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

// //////////////////////////////////////////////////////////////// Font Options
.font-sizes {
  align-items: flex-end;
}

.size-button {
  position: relative;
  display: flex;
  &:first-child,
  &:last-child {
    margin-bottom: torem(11);
    transition: 150ms ease;
    filter: drop-shadow(0px 1px 1px rgba(#2C2E35, 0.5));
    &:hover {
      transform: scale(1.05);
      filter: drop-shadow(0px 1px 2px rgba(#2C2E35, 0.5));
    }
  }
  .input {
    position: absolute;
    left: 50%;
    top: 50%;
    width: torem(26);
    transform: translate(-50%, -50%);
    color: white;
    font-size: torem(12);
    font-family: 'Source Code Pro';
    font-weight: 600;
    line-height: 1;
    text-align: center;
    pointer-events: none; // remove to enable input interaction
  }
  .label {
    position: absolute;
    left: 50%;
    top: calc(50% - torem(2));
    transform: translate(-50%, -50%);
    font-family: 'Nunito';
    font-weight: 800;
    color: $stormGray;
    @include small {
      font-size: torem(18);
    }
  }
}

input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  margin: 0; 
}
</style>
