<template>
  <svg class="icon icon-chevron" viewBox="0 0 9 6" fill="none" xmlns="http://www.w3.org/2000/svg" :data-thingie-id="thingieId">
    <path
      fill-rule="evenodd" 
      clip-rule="evenodd" 
      d="M8.75242 0.828032C9.08235 1.15799 9.08235 1.69297 8.75242 2.0229L4.77534 5.99998L0.798253 2.0229C0.468291 1.69297 0.468291 1.15799 0.798253 0.828032C1.12821 0.498078 1.66317 0.498078 1.99313 0.828032L4.77534 3.61024L7.55754 0.828032C7.88748 0.498078 8.42248 0.498078 8.75242 0.828032Z" 
      fill="#000000"
      :data-thingie-id="thingieId" />
  </svg>
</template>

<script>
// ====================================================================== Export
export default {
  name: 'ChevronIcon',

  props: {
    thingieId: {
      type: [Boolean, String],
      required: false,
      default: ''
    }
  }
}
</script>
