<template>
  <div id="landing-site">

    <ButtonIcon
      class="landing-site-toggle"
      :data-tooltip="tooltip"
      @clicked="handleClick">
      <Hamburger
        :open="dropdownOpen"
        :data-tooltip="tooltip" />
    </ButtonIcon>

  </div>
</template>

<script setup>
// ======================================================================== Data
const mixerStore = useMixerStore()
const { audioContext } = storeToRefs(mixerStore)
const generalStore = useGeneralStore()
const { siteData } = storeToRefs(generalStore)

const dropdownOpen = ref(false)

const tooltip = computed(() => siteData.value?.settings?.tooltips['mode-menu-toggle-button'])

const handleClick = () => {
  toggleAudioContext()
  console.log('click')
  // generalStore.setModal({
  //   active: !modal.value.active,
  //   action: 'auth'
  // })
}

const toggleAudioContext = () => {
  if (!audioContext.value) {
    mixerStore.createAudioContext()
  } else {
    mixerStore.toggleAudioContextPlayState()
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.landing-site-toggle {
  :deep(path),
  :deep(circle) {
    stroke: $contessa;
  }
  &:hover {
    .tooltip {
      visibility: visible;
      opacity: 1;
    }
  }
}

:deep(.hamburger) {
  width: torem(22);
  height: torem(16);
  margin: torem(10) torem(7);
  .line {
    border-color: $contessa;
  }
}

.tooltip {
  position: absolute;
  padding: torem(8) torem(24);
  top: 100%;
  right: 100%;
  white-space: nowrap;
  font-size: torem(22);
  font-weight: 700;
  color: $contessa;
  visibility: hidden;
  opacity: 0;
  transition: 200ms ease;
}
</style>
