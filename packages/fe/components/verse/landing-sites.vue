<template>
  <div id="landing-site-anchor">
    <!-- =================================================== Dropdown Toggle -->
    <ButtonIcon
      :key="activeModes.drippy"
      :active="dropdownOpen"
      :tooltip="tooltip"
      class="landing-site-toggle"
      @clicked="dropdownOpen = !dropdownOpen">
      <Hamburger
        :open="dropdownOpen"
        :data-tooltip="tooltip" />
    </ButtonIcon>

    <div :class="['landing-sites-dropdown', { open: dropdownOpen }, { transform }]">
      <!-- ============================================= Background Elements -->
      <DashedBorderRectangle
        :inherit-from="landingSitesRef"
        @loaded="transform = true" />
      <!-- =================================================== Landing Sites -->
      <div
        id="landing-sites"
        ref="landingSitesRef">
        <!-- -------------------------------------------------- Mode Toggles -->
        <ClientOnly>
          <ButtonToggle
            v-for="mode in landingSites"
            :key="mode.slug"
            :active="activeModes[mode.slug]"
            @clicked="handleModeClick(mode.slug)">
            <span :class="['label', 'nanum', { active: activeModes[mode.slug] }]">
              {{ mode.label }}
            </span>
          </ButtonToggle>
        </ClientOnly>

      </div>
    </div>

  </div>
</template>

<script setup>
// ====================================================================== Import
import { onClickOutside } from '@vueuse/core'

// ======================================================================== Data
const generalStore = useGeneralStore()
const { siteData, activeModes } = storeToRefs(generalStore)
const mixerStore = useMixerStore()
const { audioContext } = storeToRefs(mixerStore)

const dropdownOpen = ref(false)
const tooltip = ref('')
const landingSitesRef = ref(null)
const transform = ref(false)

onClickOutside(landingSitesRef, () => {
  if (dropdownOpen.value) {
    dropdownOpen.value = false
  }
})

// ==================================================================== Computed
const landingSites = computed(() => siteData.value?.settings?.landingSites || [])

// ==================================================================== Watchers
watch(() => activeModes.value.audio, (val) => {
  if (!audioContext.value) {
    mixerStore.createAudioContext()
  } else {
    mixerStore.setAudioContextPlayState(val)
  }
})

// ===================================================================== Methods
const handleModeClick = slug => {
  generalStore.toggleMode(slug)
}

// ======================================================================= Hooks
onMounted(() => {
  tooltip.value = siteData.value?.settings?.tooltips['mode-menu-toggle-button'] || ''
})
</script>

<style lang="scss" scoped>
// //////////////////////////////////////////////////////// Landing Sites toggle
.landing-site-toggle {
  --two-tone-a: #{$effy};
  --two-tone-b: white;
}

:deep(.hamburger) {
  width: torem(20);
  height: torem(14);
  .line {
    border-color: $effy;
  }
  &.open {
    .line {
      border-color: white;
    }
  }
}

// /////////////////////////////////////////////////////////////// Dropdown Menu
.landing-sites-dropdown {
  position: absolute;
  top: torem(56); // toggle height + 1rem
  right: 0;
  border-radius: torem(20);
  background-color: white;
  opacity: 0;
  visibility: hidden;
  transition: transform 300ms ease, opacity 300ms ease-in, visibility 300ms linear;
  &.transform {
    transform: scale(0.8);
  }
  &.open {
    transition: transform 300ms ease, opacity 300ms ease-out, visibility 300ms linear;
    visibility: visible;
    opacity: 1;
    transform: scale(1);
  }
}

:deep(.svg-border-rectangle) {
  rect {
    stroke: $effy;
  }
}

#landing-sites {
  padding: torem(15) torem(13);
}

// ///////////////////////////////////////////////////////////////////// Toggles
:deep(.toggle-button) {
  &:not(:last-child) {
    margin-bottom: torem(16);
  }
}

.label {
  font-weight: 700;
  font-size: torem(16);
  line-height: 1;
  color: #AAAAAA;
  transition: 200ms ease;
  &.active {
    color: $effy;
  }
}
</style>
