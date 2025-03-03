<template>
  <ZeroAlert
    mode="modal"
    alert-id="first-time-user-alert"
    class="first-time-user-alert">

    <div class="message first-time-user-modal">
      <!-- ------------------------------------------------------------ text -->
      <span class="title text">Hello!</span>
      <span class="prompt text">Hmm, you seem new here. Would you like an intro to Edit mode?</span>
      <!-- ------------------------------------------------------------ icon -->
      <IconDrippy class="icon-drippy" />
      <!-- --------------------------------------------------------- buttons -->
      <div class="button-row">
        <ButtonBasic
          class="option-button"
          @clicked="handleNextDrippyScene">
          Yes
        </ButtonBasic>
        <ButtonBasic
          class="option-button"
          @clicked="handleCloseDrippy">
          No
        </ButtonBasic>
      </div>

    </div>

  </ZeroAlert>
</template>

<script setup>
// ======================================================================== Data
const pocketStore = usePocketStore()
const alertStore = useZeroAlertStore()

// ===================================================================== Methods
const handleNextDrippyScene = () => {
  pocketStore.setDrippyScene(2)
  alertStore.closeAlert('first-time-user-alert')
}

const handleCloseDrippy = () => {
  pocketStore.setDrippyScene(0)
  alertStore.closeAlert('first-time-user-alert')
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.first-time-user-alert {
  &:before {
    display: none;
  }
}

.message {
  position: absolute;
  left: 50%;
  top: 50%;
  padding: torem(16);
  border-radius: torem(20);
  transform: translate(-50%, -50%) scale(0.8);
  transition: 300ms ease;
  background-color: $athensGray;
  // box-shadow: 0 torem(6) torem(10) rgba(0, 0, 0, 0.25);
  @include modalShadow;
  .title {
    font-weight: 600;
  }
  .title,
  .prompt {
    margin-bottom: torem(10);
  }
  .text {
    display: block;
    font-size: torem(12);
    line-height: 1.5;
  }
  .option-button {
    &:first-child {
      margin-right: torem(8);
    }
  }
}

.icon-drippy {
  position: absolute;
  top: 100%;
  right: 100%;
  transform: translate(30%, -30%);
  filter: drop-shadow(0px 0px 25px #B2B9CC) drop-shadow(1px 2px 4px rgba(#262222, 0.25));
}
</style>
