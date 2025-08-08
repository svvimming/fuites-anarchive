<template>
  <ZeroAlert
    mode="modal"
    alert-id="delete-thingie-alert"
    class="delete-thingie-alert">
    
    <div class="message delete-thingie-modal">
      <!-- ------------------------------------------------------------ text -->
      <span class="title text">Wait!</span>
      <span class="prompt text">Are you sure you want to delete this thingie forever?<br>It might be better off in the compost...</span>
      <!-- --------------------------------------------------------- buttons -->
      <div class="button-row">
        <ButtonBasic
          class="option-button"
          :force-disabled="thingies.refresh"
          @clicked="handleCompostThingie">
          Compost
        </ButtonBasic>
        <ButtonBasic
          class="option-button"
          :force-loading="thingies.refresh"
          :force-disabled="thingies.refresh"
          @clicked="handleDeleteThingie">
          Yes, delete thingie
        </ButtonBasic>
        <ButtonBasic
          class="option-button"
          :force-disabled="thingies.refresh"
          @clicked="alertStore.closeAlert('delete-thingie-alert')">
          Cancel
        </ButtonBasic>
      </div>

    </div>

  </ZeroAlert>
</template>

<script setup>
// ======================================================================== Data
const alertStore = useZeroAlertStore()
const collectorStore = useCollectorStore()
const { thingies, editing } = storeToRefs(collectorStore)

// ===================================================================== Methods
const handleCompostThingie = () => {
  if (editing.value) {
    collectorStore.initThingieUpdate({
      _id: editing.value,
      location: 'compost'
    })
  }
  alertStore.closeAlert('delete-thingie-alert')
  collectorStore.setEditing(false)
}

const handleDeleteThingie = async () => {
  if (editing.value) {
    await collectorStore.postDeleteThingie({ _id: editing.value })
  }
  alertStore.closeAlert('delete-thingie-alert')
  collectorStore.setEditing(false)
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
