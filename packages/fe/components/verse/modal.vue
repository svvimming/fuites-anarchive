<template>
  <div id="modal" :class="[{ open: modal.active }]">
    
    <VerseAuth
      v-if="modal.action === 'auth'"
      @close-modal="generalStore.closeModal()" />

  </div>
</template>

<script setup>
// ======================================================================== Data
const generalStore = useGeneralStore()
const { modal } = storeToRefs(generalStore)
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
#modal {
  padding: 2rem;
  border: solid 1px black;
  border-radius: torem(20);
  visibility: hidden;
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8);
  transition: 300ms ease;
  &.open {
    visibility: visible;
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>
