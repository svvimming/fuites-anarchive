<template>
  <div
    ref="dropdown"
    :class="['dropdown-panel', `toggle-on-${toggleOn}`]">

    <!--
      @slot Accepts an element that will toggle the menu visibility and display the selected value (if `displaySelected` prop is enabled).
        @binding {func} toggle-panel Passes the [togglePanel](/zero-core/components/dropdown#togglepanel) method to the slot.
        @binding {boolean} panel-open The current state of the dropdown panel; true for open, false for closed.
        @binding {func} close-panel Passes the [closePanel](/zero-core/components/dropdown#closepanel) method to the slot.
        @binding {string|Object} selected Passes the current selected option to the slot.
     -->
    <slot
      name="toggle-button"
      :toggle-panel="togglePanel"
      :panel-open="panelOpen"
      :close-panel="closePanel"
      :selected="selected">
    </slot>

    <div :class="['panel-container', { open: panelOpen }]">

      <div class="panel">
        <!--
          @slot Accepts a list of elements generated from the dropdown options.
            @binding {func} close-panel Passes the [closePanel](/zero-core/components/dropdown#closepanel) method to the slot.
            @binding {func} set-selected Passes the [setSelected](/zero-core/components/dropdown#setselected) method to the slot.
            @binding {func} is-selected Passes the [isSelected](/zero-core/components/dropdown#isselected) method to the slot.
          -->
        <slot
          name="dropdown-panel"
          :close-panel="closePanel"
          :set-selected="setSelected"
          :is-selected="isSelected">
        </slot>
      </div>

    </div>

  </div>
</template>

<script setup>
/**
 * @description A dropdown menu component that exposes two slots; a dropdown button and a panel of options. [See below](/zero-core/components/dropdown#slots) for a description of each. When the dropdown menu is open, clicking anywhere outside the dropdown causes it to close. This functionality is provided by VueUse's [onClickOutside](https://vueuse.org/core/onClickOutside/).
 * The options panel (dropdown menu) is wrapped in a `.panel-container` container element. The top offset of this element ('padding-top' or 'top') and panel width and/or max-height must be set in the parent component as these are custom properties that will differ panel-to-panel.
 */
// ===================================================================== Imports
import { onClickOutside } from '@vueuse/core'

// ======================================================================= Props
const props = defineProps({
  /**
   * The type of event that should initiate dropdown toggle.
   * @values click, hover
   */
  toggleOn: {
    type: String,
    required: false,
    default: 'click'
  },
  /**
   * Determines if the current value of the dropdown should be displayed in the toggle button slot.
   */
  displaySelected: {
    type: Boolean,
    required: false,
    default: false
  },
  /**
   * The initial option to load as 'selected'. This should match one of the options passed to the setSelected and isSelected bindings on the dropdown-panel slot from the parent component's option list.
   */
  defaultOption: {
    type: [String, Object],
    required: false,
    default: ''
  }
})

const emit = defineEmits([
  /**
   * When the dropdown panel is toggled, emits the new state of the panel; true for open, false for closed.
   * @returns {boolean}
   */
  'dropdownPanelToggled',
  /**
   * Emits the selected option value.
   * @returns {string|Object}
   */
  'optionSelected'
])

// ======================================================================== Data
const panelOpen = ref(false)
const selected = ref(props.defaultOption)
const dropdown = ref(null)

onClickOutside(dropdown, () => { closePanel() })

// ==================================================================== Watchers
watch(panelOpen, (state) => { emit('dropdownPanelToggled', state) })

watch(selected, (val) => { emit('optionSelected', val) })

// ===================================================================== Methods
/**
 * @method togglePanel
 * @desc - Toggles the dropdown panel open state if the `toggleOn` prop is set to 'click'
 */

const togglePanel = () => {
  if (props.toggleOn === 'click') {
    panelOpen.value = !panelOpen.value
  }
}

/**
 * @method closePanel
 * @desc - Sets the dropdown panel state to closed if the `toggleOn` prop is set to click and the panel is already open.
 */

const closePanel = () => {
  if (props.toggleOn === 'click' && panelOpen.value) {
    panelOpen.value = false
  }
}

/**
 * @method setSelected
 * @desc - Sets the selected value of the dropdown menu, only if the `displaySelected` prop is set to `true`. Also closes the open dropdown panel.
 * @param {string|Object} value - The option value to set as selected.
 */

const setSelected = value => {
  if (props.displaySelected) {
    selected.value = value
  }
  closePanel()
}

/**
 * @method isSelected
 * @desc - Tests if the argument value is currently the selected value. Returns the test result.
 * @param {string|Object} value - The option value to test.
 * @returns {boolean}
 */

const isSelected = value => {
  if (typeof value === 'string') {
    return value === selected.value
  } else if (typeof value === 'object') {
    return JSON.stringify(value) === JSON.stringify(selected.value)
  }
  return false
}

defineExpose({ setSelected })
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.dropdown-panel {
  position: relative;
  &.toggle-on-hover {
    &:hover {
      .panel-container {
        transition: 150ms ease-in;
        transform: translate(-50%, 0);
        opacity: 1;
        visibility: visible;
        pointer-events: all;
      }
    }
  }
}

// /////////////////////////////////////////////////////////////////////// Panel
/**
 * .panel-container top offset ('padding-top' or 'top') and .panel width and/or
 * max-height must be set in the parent component as these are custom properties
 * that will differ panel-to-panel
 */

.panel-container {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translate(-50%, torem(4));
  transition: 150ms ease-in;
  &:not(.open) {
    transition: 150ms ease-out;
    transform: translate(-50%, torem(20));
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }
}
</style>
