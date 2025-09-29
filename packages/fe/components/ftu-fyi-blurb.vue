<template>
  <ZeroAlert
    mode="modal"
    alert-id="ftu-fyi-blurb">
    <div class="ftu-fyi-blurb">
      <div class="blurb-content">
        <span class="blurb-heading">{{ blurb.heading }}</span>
        <span class="blurb-message" v-html="blurb.message"></span>
        <span class="blurb-after" v-html="blurb.after"></span>
        <div class="button-row">
          <ButtonBasic
            class="blurb-button"
            @clicked="alertStore.closeAlert('ftu-fyi-blurb')">
            Got it
          </ButtonBasic>
        </div>
      </div>
    </div>
  </ZeroAlert>
</template>

<script setup>
// ======================================================================== Data
const generalStore = useGeneralStore()
const { siteData } = storeToRefs(generalStore)
const alertStore = useZeroAlertStore()

// ==================================================================== Computed
const blurb = computed(() => siteData.value?.settings?.ftuFyiBlurb || {})
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.ftu-fyi-blurb {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: torem(16) torem(2);
  border-radius: torem(20);
  transition: 300ms ease;
  background-color: $athensGray;
  min-width: torem(500);
  max-width: torem(560);
  z-index: 1000;
  @include modalShadow;
  span {
    display: block; 
  }
  :deep(a) {
    margin-left: torem(2.5);
    color: $billyBlue;
    font-weight: 600;
    border-bottom: 1px solid transparent;
    transition: 150ms ease;
    &:hover {
      border-bottom: 1px solid $billyBlue;
    }
  }
}

.blurb-content {
  padding: torem(8) torem(16);
}

.blurb-heading,
.blurb-after {
  width: 100%;
  text-align: center;
}

.blurb-heading {
  font-size: torem(20);
  font-weight: 600;
  color: $drippyDark;
  margin-bottom: torem(8);
}

.blurb-message {
  font-size: torem(14);
  color: $drippyDark;
  line-height: 1.3;
  margin-bottom: torem(18);
}

.blurb-after {
  font-size: torem(12);
  color: $drippyDark;
  font-style: italic;
  margin-bottom: torem(8);
}

.button-row {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
