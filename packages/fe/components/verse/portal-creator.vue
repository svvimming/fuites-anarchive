<template>
  <div
    v-if="authenticated"
    :class="['portal-creator', { active: portalCreatorOpen }, { 'page-exists': pageExists || !to }]"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }">

    <SpinnerMaterialCircle v-if="page.refresh || checking" />

    <div class="input-wrapper">
      <input
        v-model="to"
        ref="input"
        autocomplete="off"
        autocapitalize="none"
        pattern="^[A-Za-z0-9\-._~]+$"
        placeholder="Enter a destination"
        :disabled="page.refresh"
        :class="['input', 'courier', { submitting: page.refresh }]"
        @keyup.enter="submit" />
    </div>

  </div>
</template>

<script setup>
// ====================================================================== Import
import { useDebounceFn } from '@vueuse/core'

// ======================================================================== Data
const pocketStore = usePocketStore()
const { authenticated } = storeToRefs(pocketStore)
const verseStore = useVerseStore()
const { page, sceneData, portalCreatorOpen } = storeToRefs(verseStore)
const collectorStore = useCollectorStore()
const { thingies } = storeToRefs(collectorStore)

const input = ref(null)
const to = ref('')
const position = ref({ x: 0, y: 0 })
const checking = ref(false)
const pageExists = ref(false)

// ==================================================================== Watchers
watch(portalCreatorOpen, (val) => {
  if (val && input.value) {
    position.value = { x: val.x, y: val.y }
    input.value.focus()
  }
})

watch(to, () => {
  checking.value = true
  checkPageExists()
})

// ===================================================================== Methods
/**
 * @method submit
 */

const submit = async () => {
  if (input.value?.checkValidity() && pageExists.value) {
    const vertices = [{
      location: page.value.data.name,
      page_ref: page.value.data._id
    }, {
      location: useSlugify(to.value)
    }].map(vertex => Object.assign({}, vertex, { at: {
      x: (position.value.x / sceneData.value.scale) - sceneData.value.x,
      y: (position.value.y / sceneData.value.scale) - sceneData.value.y
    } }))
    const closest = getClosestThingie()
    await verseStore.postCreatePortal({ thingieRef: closest._id, vertices })
    verseStore.setPortalCreatorOpen(false)
  } else {
    verseStore.setPortalCreatorOpen(false)
  }
}

/**
 * @method getClosestThingie
 */

const getClosestThingie = () => {
  const pos = position.value
  return thingies.value.data.map(el => ({
    dist:  Math.sqrt((el.at.x - pos.x) * (el.at.x - pos.x) + (el.at.y - pos.y) * (el.at.y - pos.y)),
    _id: el._id,
  })).reduce((a, b) => a.dist < b.dist ? a : b, { dist: Infinity })
}

/**
 * @method checkPageExists
 */

const checkPageExists = useDebounceFn(async () => {
  pageExists.value = false
  const result = await verseStore.checkPageExists({ page: useSlugify(to.value) })
  if (result) {
    pageExists.value = true
  }
  checking.value = false
})
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.portal-creator {
  position: absolute;
  display: flex;
  z-index: 1;
  opacity: 0;
  visibility: hidden;
  border-radius: torem(20);
  background-color: white;
  padding: torem(4) torem(14);
  box-shadow: 0px 0px 3px 1px $lavender;
  transform: translate(torem(8), -50%) scale(0.8);
  transition: opacity 200ms ease, transform 200ms ease, visibility 200ms ease;
  &:before {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
    top: 50%;
    right: 100%;
    border-top: torem(5) solid transparent;
    border-bottom: torem(5) solid transparent;
    border-right: torem(5) solid rgba($lavender, 0.5);
    transform: translateY(-50%);
  }
  &:after {
    content: '* This page doesn\'t exist!';
    position: absolute;
    top: calc(100% + torem(3));
    right: 50%;
    font-size: torem(8);
    color: $contessa;
    opacity: 1;
    transition: 150ms ease;
    transform: translateX(50%);
  }
  &.active {
    opacity: 1;
    visibility: visible;
    transform: translate(torem(8), -50%) scale(1);
    transition-delay: 10ms;
  }
  &.page-exists {
    color: $woodsmoke;
    &:after {
      opacity: 0;
    }
  }
}

:deep(.spinner) {
  position: absolute;
  right: torem(7);
  top: calc(50% - torem(6));
  circle {
    stroke: $lavender;
  }
}

.input-wrapper {
  display: flex;
  padding-right: torem(14);
}

.input {
  width: 100%;
  font-size: torem(12);
  line-height: 1.5;
  font-weight: 500;
  letter-spacing: 0.1em;
  opacity: 1;
  transition: 150ms ease;
  &.submitting {
    opacity: 0.5;
    pointer-events: none;
  }
}
</style>
