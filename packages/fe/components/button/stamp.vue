<template>
  <ZeroButton
    v-slot="{ loading }"
    class="clear">

    <SpinnerMaterialCircle v-if="loading && !disableLoader" />

    <div v-if="text" class="text">
      <ClientOnly>
        <span
          v-for="i in text.length"
          :key="`letter-${i}`"
          :class="getTextClasses()">
          {{ text.charAt(i - 1) }}
        </span>
      </ClientOnly>
    </div>

    <div v-else class="slot">
      <slot :loading="loading" />
    </div>

  </ZeroButton>
</template>

<script setup>
// ======================================================================= Setup
defineProps({
  text: {
    type: String,
    required: false,
    default: ''
  },
  disableLoader: {
    type: Boolean,
    required: false,
    default: false
  }
})

// ===================================================================== Methods
const getTextClasses = () => {
  let classes = Math.random() > 0.5 ? 'pt-sans' : 'pt-serif'
  if (Math.random() > 0.5) {
    classes = classes + ' italic'
  }
  if (Math.random() > 0.5) {
    classes = classes + ' bold'
  }
  return classes
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.spinner {
  position: absolute;
  top: calc(50% - #{toRem(6)}); // minus half dimension of loader
  left: calc(50% - #{toRem(6)}); // minus half dimension of loader
  transform: translate(-50%, -50%);
  + .slot {
    opacity: 0;
  }
}

.slot {
  display: flex;
  flex-direction: row;
  align-items: center;
}
</style>

