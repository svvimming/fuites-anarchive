<template>
  <div id="landing-site-anchor" ref="anchorRef">
    <!-- ========================================================== Dropdown -->
    <DropdownSelector class="landing-sites-dropdown">
      <template #toggle-button="{ togglePanel, panelOpen }">
        <Tooltip
          tooltip="settings-toggle-button"
          :drippy-scene="5"
          :force-disabled="panelOpen">
          <ButtonIcon
            :active="panelOpen"
            class="landing-site-toggle"
            @clicked="togglePanel">
            <IconEllipsis />
          </ButtonIcon>
        </Tooltip>
      </template>
      <template #dropdown-panel>
        <div class="mode-toggles">
          <ClientOnly>
            <Tooltip
              v-for="mode in landingSites"
              :key="mode.slug"
              :tooltip="mode.tooltip">
              <ButtonToggle :active="activeModes[mode.slug]" @clicked="handleModeClick(mode.slug)">
                <span :class="['label', 'nanum', { active: activeModes[mode.slug] }]">
                  {{ mode.label }}
                </span>
              </ButtonToggle>
            </Tooltip>
          </ClientOnly>
        </div>
      </template>
    </DropdownSelector>
    <!-- ====================================================== Audio Toggle -->
    <Tooltip tooltip="audio-toggle-button">
      <ButtonIcon
        class="audio-toggle"
        :active="activeModes.audio"
        @click="handleModeClick('audio')">
        <IconAudio />
      </ButtonIcon>
    </Tooltip>

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

const anchorRef = ref(null)
const dropdownOpen = ref(false)

onClickOutside(anchorRef, () => {
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

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
#landing-site-anchor {
  display: flex;
  :deep(.tooltip) {
    &:last-child {
      margin-left: torem(20);
    }
  }
}

.landing-site-toggle,
.audio-toggle {
  --two-tone-a: #{$gullGray};
  --two-tone-b: white;
  :deep(.slot) {
    path,
    circle {
      transition: 200ms ease;
    }
  }
  &.active {
    :deep(.slot) {
      path {
        stroke: var(--two-tone-b);
      }
      circle {
        fill: var(--two-tone-b);
      }
    }
  }
}

// /////////////////////////////////////////////////////////////// Dropdown Menu
.landing-sites-dropdown {
  position: relative;
  :deep(.panel-container) {
    right: 0;
    left: unset;
    transform: translate(0, torem(12));
    &:not(.open) {
      transform: translate(0, torem(20));
    }
  }
}

.mode-toggles {
  padding: torem(16);
  border-radius: torem(10);
  background-color: $athensGray;
  @include modalShadow;
  :deep(.tooltip) {
    margin-left: 0 !important;
    &:not(:last-child) {
      margin-bottom: torem(16);
    }
  }
}

// //////////////////////////////////////////////////////////////// Mode Toggles
.label {
  font-weight: 700;
  font-size: torem(16);
  line-height: 1;
  color: #AAAAAA;
  white-space: nowrap;
  transition: 200ms ease;
  &.active {
    color: $effy;
  }
}

// //////////////////////////////////////////////////////////////// Audio Toggle
.audio-toggle {
  display: flex;
  align-items: center;
}
</style>
