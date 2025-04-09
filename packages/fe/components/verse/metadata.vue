<template>
  <div id="verse-metadata">
    <!-- --------------------------------------------------------- To Verses -->
    <Tooltip
      tooltip="multiverse-link"
      contact="bottom-right"
      :drippy-scene="4"
      class="to-multiverse-tooltip">
      <ButtonIcon
        tag="nuxt-link"
        to="/"
        class="to-multiverse">
        <IconMultiverse class="icon"/>
      </ButtonIcon>
    </Tooltip>

    <button :class="['portal-indicator', { active }]">
      <span class="portal-to">
        portal to
      </span>
      <IconArrowRight class="icon"/>
      <span v-if="destination">
        {{ destination }}
      </span>
    </button>

  </div>
</template>

<script setup>
// ======================================================================== Data  
const generalStore = useGeneralStore()
const { mouseOverScene } = storeToRefs(generalStore)
const destination = ref(false)
const active = ref(false)

// ==================================================================== Watchers
watch(mouseOverScene, val => {
  if (val?.type === 'portal') {
    destination.value = val.attrs.destination
    active.value = true
  } else if (destination.value) {
    active.value = false
  }
})
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
#verse-metadata {
  display: flex;
  align-items: center;
}

.to-multiverse-tooltip {
  position: relative;
  z-index: 2;
}

:deep(.to-multiverse) {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  --two-tone-a: #{$drippyCore};
  --two-tone-b: white;
  .icon {
    width: torem(20);
    height: torem(20);
    path,
    circle {
      stroke: $drippyCore;
    }
    circle {
      fill: $drippyCore;
    }
  }
}

.portal-indicator {
  display: flex;
  align-items: center;
  height: torem(40);
  padding: torem(10) torem(16);
  border-radius: torem(24);
  margin-left: torem(20);
  background-color: $athensGray;
  font-size: torem(16);
  font-weight: 600;
  color: $drippyCore;
  opacity: 0;
  visibility: hidden;
  transition: 200ms ease;
  filter: drop-shadow(0px 6px 6px rgba(#3E4559, 0.25));
  .portal-to {
    font-style: italic;
  }
  span {
    margin-bottom: torem(2);
  }
  .icon {
    margin: 0 torem(10);
    :deep(path) {
      stroke: $drippyCore;
    }
  }
  &.active {
    opacity: 1;
    visibility: visible;
  }
}
</style>
