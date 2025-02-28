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
.basic-button {
  background-color: $gullGray;
  border-radius: torem(10);
  padding: torem(10) torem(25);
  transition: 150ms ease;
  &:hover {
    background-color: $gullGrayDark;
  }
}

.slot {
  font-size: torem(12);
  font-weight: 600;
  line-height: 1.4;
  color: white;
}

.basic-button.theme__verse {
  background-color: transparent;
  border-radius: 0;
  border-bottom: solid torem(0.5) rgba($woodsmoke, 0.5);
  &:first-child {
    border-top: solid torem(0.5) rgba($woodsmoke, 0.5);
  }
  .slot {
    display: flex;
    align-items: center;
    text-align: left;
    color: $woodsmoke;
    // :deep(svg) {
    //   width: torem(10);
    //   height: torem(10);
    //   margin-left: torem(6);
    // }
    // :deep(path) {
    //   fill: $woodsmoke;
    // }
  }
}

.basic-button.theme__clear {
  background-color: transparent;
  border-radius: 0;
  .slot {
    display: flex;
    align-items: center;
    text-align: left;
    color: $woodsmoke;
    letter-spacing: 1px;
    transition: 150ms ease;
    font-family: 'PT Sans';
  }
  &:hover {
    .slot {
      letter-spacing: 3px;
      font-family: 'PT Serif';
    }
  }
}
</style>
