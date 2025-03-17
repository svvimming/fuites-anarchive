<template>
  <ZeroButton
    v-slot="{ loading }"
    :force-loading="forceLoading"
    :force-disabled="forceDisabled"
    :class="['basic-button', { active }, { [`theme__${theme}`]: theme }]"
    v-bind="{ ...props }">

    <SpinnerMaterialCircle v-if="loading && !disableLoader"/>

    <div v-else class="slot">
      <slot :loading="loading" />
    </div>

  </ZeroButton>
</template>

<script setup>
// ======================================================================= Setup
const props = defineProps({
  disableLoader: {
    type: Boolean,
    required: false,
    default: false
  },
  forceLoading: {
    type: Boolean,
    required: false,
    default: false
  },
  forceDisabled: {
    type: Boolean,
    required: false,
    default: false
  },
  active: {
    type: Boolean,
    required: false,
    default: false
  },
  theme: {
    type: String,
    required: false,
    default: ''
  }
})
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.basic-button {
  position: relative;
  background-color: $gullGray;
  border-radius: torem(10);
  padding: torem(10) torem(25);
  transition: 150ms ease;
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: black;
    border-radius: torem(10);
    opacity: 0;
    transition: 150ms ease;
  }
  &:hover {
    &:before {
      opacity: 0.2;
    }
  }
}

.slot {
  position: relative;
  font-size: torem(16);
  font-weight: 600;
  line-height: 1.4;
  color: white;
}

.basic-button.theme__clear {
  background-color: transparent;
  border-radius: 0;
  &:before {
    display: none;
  }
  .slot {
    display: flex;
    align-items: center;
    text-align: left;
    color: $woodsmoke;
    letter-spacing: 1px;
    transition: 150ms ease;
    font-family: 'Source Sans Pro';
  }
  &:hover {
    .slot {
      letter-spacing: 3px;
      // font-family: 'Source Serif Pro';
      // transform: translateY(torem(-0.5));
    }
  }
}
</style>
