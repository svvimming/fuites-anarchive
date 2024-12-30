<template>
  <div
    :class="['portal-creator', { active: authenticated && portalCreatorOpen }]"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }">

    <div class="input-wrapper">
      <input
        v-model="to"
        ref="input"
        autocomplete="off"
        class="input courier"
        autocapitalize="none"
        pattern="^[A-Za-z0-9\-._~]+$"
        placeholder="Enter a destination"
        @keyup.enter="submit" />
    </div>

  </div>
</template>

<script setup>
// ======================================================================== Data
const pocketStore = usePocketStore()
const { authenticated } = storeToRefs(pocketStore)
const verseStore = useVerseStore()
const { portalCreatorOpen } = storeToRefs(verseStore)

const input = ref(null)
const to = ref('')
const position = ref({ x: 0, y: 0 })

// ==================================================================== Watchers
watch(portalCreatorOpen, (val) => {
  if (val && input.value) {
    position.value = { x: val.x, y: val.y }
    input.value.focus()
  }
})

// ===================================================================== Methods
const submit = async () => {
  if (input.value?.checkValidity()) {

  }
}
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
  &.active {
    opacity: 1;
    visibility: visible;
    transform: translate(torem(8), -50%) scale(1);
    transition-delay: 10ms;
  }
}

.input-wrapper {
  display: flex;
}

.input {
  width: 100%;
  font-size: torem(12);
  line-height: 1.5;
  font-weight: 500;
  letter-spacing: 0.1em;
}
</style>
