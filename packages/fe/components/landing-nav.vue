<template>
  <div class="landing-nav">
    <div class="grid-noBottom">
      <div class="col-12_lg-10_ti-12" data-push-left="off-0_lg-1_ti-0">

        <div class="logo-container">
          <SiteLogo v-once />
        </div>

        <ButtonBasic
          theme="clear"
          class="info-button"
          @clicked="toggleInfoModal">
          Info
        </ButtonBasic>

        <ButtonDashed
          :stylized="enterTokenButtonText"
          :active="enterTokenButtonActive"
          :flat-dashes="4"
          class="enter-token-button"
          @clicked="handleEnterTokenClick">
          <template #icon-after>
            <IconKey class="icon" />
          </template>
        </ButtonDashed>

      </div>
    </div>
  </div>
</template>

<script setup>
// ======================================================================== Data
const alertStore = useZeroAlertStore()
const enterTokenButtonActive = ref(false)
const enterTokenButtonText = [
  { letter: 'e', classes: 'source-serif-pro semibold italic' },
  { letter: 'n', classes: 'source-sans-pro bold' },
  { letter: 't', classes: 'source-serif-pro semibold italic' },
  { letter: 'e', classes: 'source-sans-pro bold italic' },
  { letter: 'r', classes: 'source-serif-pro semibold' },
  { letter: ' ', classes: '' },
  { letter: 't', classes: 'source-serif-pro italic bold' },
  { letter: 'o', classes: 'source-serif-pro semibold italic' },
  { letter: 'k', classes: 'source-sans-pro bold' },
  { letter: 'e', classes: 'source-serif-pro semibold italic' },
  { letter: 'n', classes: 'source-sans-pro bold italic' }
]

// ===================================================================== Methods
const toggleInfoModal = () => {
  const alert = alertStore.getAlert('multiverse-info-modal')
  if (alert) {
    alertStore.openAlert('multiverse-info-modal')
  }
}

const handleEnterTokenClick = () => {
  alertStore.openAlert('multiverse-auth-alert')
}
</script>

<style lang="scss" scoped>
.landing-nav {
  position: absolute;
  padding-top: torem(140);
  top: 0;
  left: 0;
  width: 100%;
  z-index: 3;
}

.logo-container {
  margin-bottom: torem(12);
  :deep(.letter) {
    color: $woodsmoke;
  }
}

.info-button {
  margin-left: torem(28);
  margin-bottom: torem(12);
  :deep(.slot) {
    color: $woodsmoke !important;
  }
}

.enter-token-button {
  margin-left: torem(34);
  --two-tone-a: #{$billyBlue};
  :deep(.stylized) {
    margin-right: torem(6);
  }
}
</style>
