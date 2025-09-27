<template>
  <div class="searchbar-container">
    <input
      v-model="searchTerm"
      :placeholder="placeholder"
      :class="['searchbar', { empty: searchTerm === '' }]"
      autocomplete="none" />
  </div>
</template>

<script setup>
// ======================================================================= Setup
defineProps({
  placeholder: {
    type: String,
    required: false,
    default: ''
  }
})

// ======================================================================== Data
const searchTerm = ref('')

const emit = defineEmits(['valueUpdated'])

// ===================================================================== Methods
/**
 * @method clear
 */

const clear = () => {
  searchTerm.value = ''
}

// ==================================================================== Watchers
watch(searchTerm, searchTerm => {
  emit('valueUpdated', searchTerm)
})

defineExpose({ clear })
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.searchbar-container {
  position: relative;
  &:after {
    content: '';
    position: absolute;
    right: torem(12);
    top: 50%;
    transform: translateY(-50%);
    width: torem(16);
    height: torem(16);
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg class='icon search' xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewBox='0 0 16 16'%3e%3cpath d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0' fill='%238393C0' /%3e%3c/svg%3e");
    background-size: torem(16);
    background-position: center;
    background-repeat: no-repeat;
  }
}

.searchbar {
  padding-left: torem(12);
  padding-right: torem(30);
  width: 100%;
  height: torem(36);
  border-radius: torem(18);
  border: 1px solid rgba(#8393C0, 0.5); // $drippyCore
  transition: 150ms ease-out;
  color: $drippyDark;
  font-weight: 500;
  &:hover {
    transition: 150ms ease-in;
    border-color: $drippyCore;
  }
  &:focus,
  &:not(.empty) {
    transition: 150ms ease-in;
    border-color: $drippyCore;
  }
}

input::placeholder {
  color: $drippyCore;
  font-weight: 400;
}
</style>
