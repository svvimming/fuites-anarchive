<template>
  <div id="landing-site-anchor" ref="anchorRef">
    <!-- ========================================================== Dropdown -->
    <DropdownSelector
      v-if="authenticated"
      class="landing-sites-dropdown">
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
                <span :class="['label', { active: activeModes[mode.slug] }]">
                  {{ mode.label }}
                </span>
              </ButtonToggle>
            </Tooltip>
          </ClientOnly>
        </div>
      </template>
    </DropdownSelector>
    <!-- ====================================================== Lock Toggle -->
    <Tooltip
      v-if="lockedThingies.length > 0"
      tooltip="thingie-lock-toggle">
      <ButtonIcon
        class="lock-toggle"
        :active="true"
        @click="handleUnlockPageThingies">
        <IconLock />
      </ButtonIcon>
    </Tooltip>
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
const pocketStore = usePocketStore()
const { authenticated } = storeToRefs(pocketStore)
const verseStore = useVerseStore()
const { page } = storeToRefs(verseStore)
const collectorStore = useCollectorStore()
const { thingies } = storeToRefs(collectorStore)

const anchorRef = ref(null)
const dropdownOpen = ref(false)

onClickOutside(anchorRef, () => {
  if (dropdownOpen.value) {
    dropdownOpen.value = false
  }
})

// ==================================================================== Computed
const landingSites = computed(() => siteData.value?.settings?.landingSites || [])
const lockedThingies = computed(() => thingies.value.data.filter(thingie => thingie.location === page.value.data?.name && thingie.locked))

// ==================================================================== Watchers
watch(() => activeModes.value.audio, (val) => {
  if (!audioContext.value) {
    mixerStore.createAudioContext()
  } else {
    mixerStore.setAudioContextPlayState(val)
  }
})

// ===================================================================== Methods
/**
 * @method handleModeClick
 */

const handleModeClick = slug => {
  generalStore.toggleMode(slug)
}

/**
 * @method handleUnlockPageThingies
 */

const handleUnlockPageThingies = () => {
  const locked = lockedThingies.value.map(item => item._id)
  const len = locked.length
  for (let i = 0; i < len; i++) {
    const lockedId = locked[i]
    collectorStore.initThingieUpdate({ _id: lockedId, locked: false })
  }
}

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
#landing-site-anchor {
  display: flex;
  :deep(.tooltip) {
    margin-left: torem(20);
  }
}

.landing-site-toggle,
.lock-toggle,
.audio-toggle {
  --two-tone-a: #{$drippyCore};
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

.landing-site-toggle {
  &:after {
    content: '';
    position: absolute;
    right: calc(100% - torem(5.5));
    top: torem(6);
    width: 0;
    height: 0;
    border-top: torem(14) solid transparent;
    border-bottom: torem(14) solid transparent;
    border-right: torem(14) solid white;
    z-index: -1;
    transition: 200ms ease-in;
    opacity: 0;
    transform: translateX(torem(14));
    // background-color: var(--two-tone-b);
  }
  &.active {
    &:after {
      transition: 200ms ease;
      transform: translateX(0);
      opacity: 1;
      border-right: torem(14) solid var(--two-tone-a);
    }
  }
}

// /////////////////////////////////////////////////////////////// Dropdown Menu
.landing-sites-dropdown {
  position: relative;
  :deep(.panel-container) {
    top: 0;
    right: 100%;
    left: unset;
    transform: translate(torem(-20), 0);
    &:not(.open) {
      transform: translate(torem(-20), torem(8));
    }
  }
}

.mode-toggles {
  padding: torem(16);
  border-radius: torem(25);
  background-color: $athensGray;
  box-shadow: 0 torem(6) torem(6) rgba(#3E4559, 0.25);
  :deep(.tooltip) {
    margin-left: 0 !important;
    &:not(:last-child) {
      margin-bottom: torem(16);
    }
  }
}

// //////////////////////////////////////////////////////////////// Mode Toggles
.label {
  font-weight: 600;
  font-size: torem(16);
  line-height: 1;
  color: $drippyCore;
  white-space: nowrap;
  transition: 200ms ease;
}

// //////////////////////////////////////////////////////////////// Audio Toggle
.audio-toggle {
  display: flex;
  align-items: center;
  &:after {
    content: '';
    position: absolute;
    left: calc(50% - torem(1));
    top: torem(-7);
    width: 0;
    height: torem(50);
    background-color: $pollyPink;
    border-radius: torem(2);
    border: torem(1) solid $pollyPink;
    transform: rotate(45deg);
    transform-origin: center;
    opacity: 1;
    transition: 200ms ease;
  }
  &.active {
    &:after {
      opacity: 0;
    }
  }
}
</style>
