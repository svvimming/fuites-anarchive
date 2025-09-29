<template>
  <ZeroAlert
    mode="modal"
    alert-id="multiverse-info-modal"
    class="multiverse-info-modal-alert">
    <div ref="alertRef" class="alert-message">

      <button
        class="close-button"
        @click="alertStore.closeAlert('multiverse-info-modal')">
        <IconClose />
      </button>
      
      <div class="info-heading">
        <span class="about">About</span>
        <SiteLogo :base-fontsize="20" />
      </div>

      <ContentRenderer
        v-if="markdown"
        :value="markdown"
        class="global-markdown-content" />

      <IconCanadaCouncil class="canada-council-icon" />

    </div>
  </ZeroAlert>
</template>

<script setup>
// ====================================================================== Import
import { onClickOutside } from '@vueuse/core'

// ======================================================================= Setup
const props = defineProps({
  markdown: {
    type: Object,
    required: true
  }
})

const alertStore = useZeroAlertStore()
const alertRef = ref(null)

onClickOutside(alertRef, () => {
  const alert = alertStore.getAlert('multiverse-info-modal')
  if (alert.status === 'open') {
    alertStore.closeAlert('multiverse-info-modal')
  }
})
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.multiverse-info-modal-alert {
  z-index: 1000 !important;
  &.open {
    transform: translateY(0);
    .alert-message {
      transform: translate(-50%, -50%);
    }
  }
}

.info-heading {
  display: flex;
  position: relative;
  z-index: 2;
  margin-bottom: torem(20);
  border-bottom: 1px solid rgba(#B2B9CC, 0.5);
  .about {
    font-size: torem(20);
    font-weight: 600;
    color: $drippyDark;
  }
  :deep(.site-logo) {
    transform: translateY(torem(-15));
    height: torem(48);
    .letter {
      color: $drippyDark;
      &:first-child {
        top: torem(5) !important;
        font-family: 'Source Sans Pro', sans-serif !important;
      }
    }
  }
}

.alert-message {
  position: absolute;
  top: 50%;
  left: 50%;
  width: torem(500);
  transform: translate(-50%, calc(-50% + torem(12)));
  padding: torem(18) torem(22);
  border-radius: torem(20);
  transition: 300ms ease;
  background-color: $athensGray;
  max-width: torem(480);
  @include modalShadow;
  @include mini {
    max-width: torem(360);
  }
}

.close-button {
  position: absolute;
  top: torem(18);
  right: torem(22);
  z-index: 100;
  transition: 200ms ease;
  &:hover {
    transform: scale(1.1);
  }
}

// ////////////////////////////////////////////////////////// Modal Form Styling
.heading {
  display: block;
  padding-bottom: torem(18);
  margin-bottom: torem(18);
  width: 100%;
  font-weight: 600;
  font-size: torem(20);
  color: $drippyDark;
  border-bottom: 1px solid rgba(#B2B9CC, 0.5);
}

.canada-council-icon {
  max-width: torem(231);
  margin-top: torem(20);
}

</style>
