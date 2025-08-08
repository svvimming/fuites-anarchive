<template>
  <ZeroAlert
    mode="modal"
    alert-id="delete-portal-alert"
    class="delete-portal-alert">
    
    <div class="message delete-portal-modal">
      <!-- ------------------------------------------------------------ text -->
      <span class="title text">Delete Portal</span>
      <span class="prompt text">Are you sure you want to delete this portal?</span>
      <!-- --------------------------------------------------------- buttons -->
      <div class="button-row">
        <ButtonBasic
          class="option-button"
          :force-disabled="page.refresh"
          @clicked="handleDeletePortal">
          Yes, delete portal
        </ButtonBasic>
        <ButtonBasic
          class="option-button"
          :force-disabled="page.refresh"
          @clicked="alertStore.closeAlert('delete-portal-alert')">
          Cancel
        </ButtonBasic>
      </div>
    </div>

  </ZeroAlert>
</template>

<script setup>
// ======================================================================== Data
const alertStore = useZeroAlertStore()
const verseStore = useVerseStore()
const { page } = storeToRefs(verseStore)

// ===================================================================== Methods
const handleDeletePortal = async () => {
  await verseStore.postDeletePortal()
  alertStore.closeAlert('delete-portal-alert')
}

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.message {
  position: absolute;
  left: 50%;
  top: 50%;
  min-width: torem(340);
  padding: torem(16);
  border-radius: torem(20);
  transform: translate(-50%, -50%);
  transition: 300ms ease;
  background-color: $athensGray;
  // box-shadow: 0 torem(6) torem(10) rgba(0, 0, 0, 0.25);
  @include modalShadow;
  .title,
  .prompt {
    margin-bottom: torem(10);
  }
  .text {
    display: block;
    font-size: torem(14);
    line-height: 1.5;
  }
  .title {
    font-weight: 600;
    font-size: torem(16);
  }
}

.button-row {
  display: flex;
  margin-top: torem(20);
}

.option-button {
  display: flex;
  align-items: center;
  padding: torem(10) torem(16);
  &:not(:last-child) {
    margin-right: torem(8);
  }
}
</style>
