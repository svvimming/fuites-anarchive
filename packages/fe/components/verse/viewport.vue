<template>
  <div ref="viewport" :class="['verse-viewport', { [`drippy-scene-${drippy}`]: drippy }]">
    <!-- --------------------------------------------------------- To Verses -->
    <Tooltip
      tooltip="multiverse-link"
      contact="bottom-right"
      :drippy-scene="4"
      class="to-multiverse-tooltip">
      <ButtonIcon
        tag="nuxt-link"
        to="/multiverse"
        class="to-multiverse">
        <IconMultiverse class="icon"/>
      </ButtonIcon>
    </Tooltip>
    <!-- ------------------------------------------------------ Page Creator -->
    <VersePageCreator />
    <!-- ----------------------------------------------------- Landing Sites -->
    <VerseLandingSites />
    <!-- ------------------------------------------------------------ Pocket -->
    <Pocket />
    <!-- ---------------------------------------------------- Compost Portal -->
    <CompostPortal v-if="!inCompost" />
    <!-- ---------------------------------------------------- Portal Creator -->
    <VersePortalCreator />
    <!-- ------------------------------------------------------- Text Editor -->
    <VerseTextEditor />
    <!-- ------------------------------------------------------------- Caddy -->
    <ClientOnly><Caddy :container="viewport" /></ClientOnly>
    <!-- ---------------------------------------------- Delete Thingie Alert -->
    <VerseDeleteThingieAlert />
    <!-- --------------------------------------------- First Time User Alert -->
    <VerseFirstTimeUserAlert />
    <!-- ---------------------------------------------------- Cursor Tooltip -->
    <TooltipCursor v-if="activeModes.tooltips" />

  </div>
</template>

<script setup>
// ======================================================================== Data
const route = useRoute()
const generalStore = useGeneralStore()
const { activeModes } = storeToRefs(generalStore)
const pocketStore = usePocketStore()
const { drippy } = storeToRefs(pocketStore)
const alertStore = useZeroAlertStore()
const viewport = ref(null)

// ==================================================================== Computed
const inCompost = computed(() => route.params.page === 'compost')

// ==================================================================== Watchers
watch(drippy, (scene) => {
  if (scene === 1) {
    alertStore.openAlert('first-time-user-alert')
  }
}, { immediate: true })

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.verse-viewport {
  width: 100%;
  height: 100%;
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba($woodsmoke, 0.8);
    transition: 300ms ease;
    visibility: hidden;
    opacity: 0;
    z-index: 1;
  }
  &.drippy-scene-1,
  &.drippy-scene-2,
  &.drippy-scene-3,
  &.drippy-scene-4,
  &.drippy-scene-5 {
    &:before {
      visibility: visible;
      opacity: 1;
      z-index: 4;
    }
  }
  &.drippy-scene-1 {
    :deep(.first-time-user-alert) {
      z-index: 5;
    }
  }
  &.drippy-scene-2 {
    :deep(#pocket-anchor) {
      z-index: 5;
    }
  }
  &.drippy-scene-3 {
    :deep(#compost-portal-anchor) {
      z-index: 5;
    }
  }
  &.drippy-scene-4 {
    .to-multiverse-tooltip {
      z-index: 5;
    }
  }
  &.drippy-scene-5 {
    :deep(#landing-site-anchor) {
      z-index: 5;
    }
  }
}

.to-multiverse-tooltip {
  position: absolute;
  top: torem(25);
  left: torem(25);
  z-index: 2;
}

:deep(.to-multiverse) {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  --two-tone-a: #{$blueHaze};
  --two-tone-b: white;
  .icon {
    width: torem(20);
    height: torem(20);
    path,
    circle {
      stroke: $blueHaze;
    }
    circle {
      fill: $blueHaze;
    }
  }
}

:deep(#landing-site-anchor) {
  position: absolute;
  top: torem(25);
  right: torem(25);
  z-index: 2;
}

:deep(#pocket-anchor) {
  position: absolute;
  bottom: torem(25);
  right: torem(25);
  z-index: 2;
}

:deep(#compost-portal-anchor) {
  position: absolute;
  bottom: torem(25);
  left: torem(25);
  z-index: 3;
}

:deep(.first-time-user-alert) {
  z-index: 3;
}
</style>
