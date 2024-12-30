<template>
  <ZeroAlert
    mode="modal"
    alert-id="multiverse-auth-alert">

    <div class="new-page-modal">
      <Auth
        message="Enter a token below to see the verses you have access to."
        @authenticate-success="handleAuthSuccess" />
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
  alertStore.closeAlert('multiverse-auth-alert')
}

// ======================================================================= Hooks
onMounted(() => {
  if (!authenticated.value) {
    alertStore.openAlert('multiverse-auth-alert')
  }
})
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.new-page-modal {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%) scale(0.8);
  transition: 300ms ease;
  // box-shadow: 0 torem(6) torem(10) rgba(0, 0, 0, 0.25);
}
</style>
