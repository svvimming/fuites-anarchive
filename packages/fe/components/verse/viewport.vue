<template>
  <div ref="viewport" :class="['verse-viewport', { [`drippy-scene-${drippy}`]: drippy }]">
    <!-- ------------------------------------------------------ Page Creator -->
    <VersePageCreator />
    <!-- ---------------------------------------------------------- Metadata -->
    <VerseMetadata />
    <!-- ----------------------------------------------------- Landing Sites -->
    <VerseLandingSites />
    <!-- ------------------------------------------------------------ Pocket -->
    <Pocket :mobile-drag-to="dragTo === 'pocket'" />
    <!-- ---------------------------------------------------- Compost Portal -->
    <CompostPortal v-if="!inCompost" :mobile-drag-to="dragTo === 'compost'" />
    <!-- ---------------------------------------------------- Portal Creator -->
    <VersePortalCreator />
    <!-- ------------------------------------------------------- Text Editor -->
    <VerseTextEditor :force-hide="small && hideMobileTextEditor" />
    <!-- ------------------------------------------------------------- Caddy -->
    <ClientOnly>
      <Caddy v-if="!small" :container="viewport" />
      <CaddyMobile v-else @emit-selected="handleCaddyMobileSelected" />
    </ClientOnly>
    <!-- ---------------------------------------------- Delete Thingie Alert -->
    <VerseDeleteThingieAlert />
    <!-- --------------------------------------------- First Time User Alert -->
    <VerseFirstTimeUserAlert />
    <!-- ----------------------------------------------- Delete Portal Alert -->
    <VerseDeletePortalAlert />
    <!-- ---------------------------------------------------- Cursor Tooltip -->
    <TooltipCursor v-if="activeModes.tooltips && !small" />
    <!-- ---------------------------------------- Create Sound Thingie Alert -->
    <VerseCreateSoundThingieAlert />
    <!-- --------------------------------------------------------- Edit Mode -->
    <Tooltip
      tooltip="mobile-edit-mode-toggle"
      contact="top-center"
      :class="['mobile-edit-mode-toggle-tooltip', { display: small }]">
      <ButtonIcon
        v-if="authenticated"
        :active="activeModes.mobileEdit"
        class="mobile-edit-mode-toggle"
        @click="handleMobileEditModeToggle">
        <IconPencil />
      </ButtonIcon>
    </Tooltip>
    <!-- ----------------------------------------------------- FTU FYI Blurb -->
    <FtuFyiBlurb class="ftu-fyi-alert" />

  </div>
</template>

<script setup>
// ======================================================================== Data
const route = useRoute()
const collectorStore = useCollectorStore()
const { thingies, editing, mobileDragThingie } = storeToRefs(collectorStore)
const generalStore = useGeneralStore()
const { activeModes, small, portalEditing } = storeToRefs(generalStore)
const pocketStore = usePocketStore()
const { drippy, authenticated } = storeToRefs(pocketStore)
const alertStore = useZeroAlertStore()
const viewport = ref(null)
const touchmoveEventListener = ref(null)
const touchendEventListener = ref(null)
const dragTo = ref('none')
const hideMobileTextEditor = ref(true)

// ==================================================================== Computed
const inCompost = computed(() => route.params.page === 'compost')

// ==================================================================== Watchers
watch(drippy, (scene) => {
  if (scene === 1) {
    alertStore.openAlert('first-time-user-alert')
  }
})

// ===================================================================== Methods
/**
 * @method handleTouchMove
 */

const handleTouchMove = e => {
  if (!activeModes.value.mobileEdit || e.touches.length > 1 || editing.value) { return }
  if (e.touches.length === 1) {
    const { clientX, clientY } = e.touches[0]
    if (clientY > window.innerHeight - 80 && clientX < 80) {
      if (dragTo.value !== 'compost') {
        dragTo.value = 'compost'
      }
    } else if (clientY > window.innerHeight - 80 && clientX > window.innerWidth - 80) {
      if (dragTo.value !== 'pocket') {
        dragTo.value = 'pocket'
      }
    } else {
      if (dragTo.value !== 'none') {
        dragTo.value = 'none'
      }
    }
  }
}

/**
 * @method handleTouchEnd
 */

const handleTouchEnd = () => {
  if (['compost', 'pocket'].includes(dragTo.value)) {
    if (mobileDragThingie.value) {
      const thingie = thingies.value.data.find(item => item._id === mobileDragThingie.value)
      const w = thingie.at.width
      const h = thingie.at.height
      const at = Object.assign({}, thingie.at, {
        x: dragTo.value === 'compost' ? Math.random() * (2732 - w) + (0.5 * w) : 650 * 0.5,
        y: dragTo.value === 'compost' ? Math.random() * (2000 - h) + (0.5 * h) : 400 * 0.5
      })
      collectorStore.initThingieUpdate({
        _id: thingie._id,
        location: dragTo.value,
        record_new_location: true,
        at
      }, true)
    }
    dragTo.value = 'none'
  }
}

/**
 * @method handleMobileEditModeToggle
 */

const handleMobileEditModeToggle = () => {
  generalStore.setMode('mobileEdit', !activeModes.value.mobileEdit)
  generalStore.setPortalEditing(!portalEditing.value)
}

/**
 * @method handleCaddyMobileSelected
 */

const handleCaddyMobileSelected = selected => {
  if (selected === 'font-editor') {
    hideMobileTextEditor.value = false
  } else {
    hideMobileTextEditor.value = true
  }
}

// ======================================================================= Hooks
onMounted(() => {
  touchmoveEventListener.value = (e) => handleTouchMove(e)
  window.addEventListener('touchmove', touchmoveEventListener.value)
  touchendEventListener.value = (e) => handleTouchEnd(e)
  window.addEventListener('touchend', touchendEventListener.value)
})

onBeforeUnmount(() => {
  if (touchmoveEventListener.value) {
    window.removeEventListener('touchmove', touchmoveEventListener.value)
  }
  if (touchendEventListener.value) {
    window.removeEventListener('touchend', touchendEventListener.value)
  }
})
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
      opacity: 1 !important;
      visibility: visible !important;
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
    :deep(#verse-metadata) {
      z-index: 5;
    }
  }
  &.drippy-scene-5 {
    :deep(#landing-site-anchor) {
      z-index: 5;
    }
  }
}

:deep(#verse-metadata) {
  position: absolute;
  top: torem(25);
  left: torem(25);
  z-index: 2;
  @include small {
    top: torem(14);
    left: torem(14);
  }
}

:deep(#landing-site-anchor) {
  position: absolute;
  top: torem(25);
  right: torem(25);
  z-index: 2;
  @include small {
    top: torem(14);
    right: torem(14);
  }
}

:deep(#pocket-anchor) {
  position: absolute;
  bottom: torem(25);
  right: torem(25);
  z-index: 2;
  @include small {
    bottom: torem(14);
    right: torem(14);
    z-index: 4;
  }
}

:deep(#compost-portal-anchor) {
  position: absolute;
  bottom: torem(25);
  left: torem(25);
  z-index: 3;
  @include small {
    bottom: torem(14);
    left: torem(14);
  }
}

:deep(.first-time-user-alert) {
  z-index: 3;
}

.mobile-edit-mode-toggle-tooltip {
  position: absolute;
  bottom: torem(14);
  left: 50%;
  transform: translateX(-50%);
  display: none;
  z-index: 2;
  &.display {
    display: block;
  }
}

.mobile-edit-mode-toggle {
  --two-tone-a: #{$drippyCore};
  --two-tone-b: white;
  transition: 200ms ease;
  :deep(.slot) {
    path {
      transition: 200ms ease;
      stroke: var(--two-tone-a);
      stroke-width: 2;
    }
  }
  &.active {
    :deep(.slot) {
      path {
        stroke: var(--two-tone-b);
      }
    }
  }
}

.ftu-fyi-alert {
  z-index: 1000;
  &:before {
    display: none;
  }
}
</style>
