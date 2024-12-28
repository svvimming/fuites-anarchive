<template>
  <ZeroAlert
    mode="modal"
    alert-id="verses-overview-auth-alert">

    <div class="message new-page-modal">
      <span class="title text">Add a token</span>
      <span class="prompt text">Enter a token below to see the verses you have access to.</span>
      <Auth @authenticate-success="handleAuthSuccess" />
    </div>

  </ZeroAlert>
</template>

<script setup>
// ======================================================================== Data
const pocketStore = usePocketStore()
const { authenticated } = storeToRefs(pocketStore)
const alertStore = useZeroAlertStore()

// ===================================================================== Methods
const handleAuthSuccess = () => {
  alertStore.closeAlert('verses-overview-auth-alert')
}

// ======================================================================= Hooks
onMounted(() => {
  if (!authenticated.value) {
    alertStore.openAlert('verses-overview-auth-alert')
  }
})
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
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
}
</style>
