<template>
  <div :class="['info-content', { 'high-z': visible }]">
    <div class="grid full">
      <div
        class="col-6_lg-7_md-8_sm-10_ti-12"
        data-push-left="off-1_sm-0">
        <div :class="['info-panel', { visible }]">

          <div class="text">
            {{ text }}
          </div>

          <button
            id="close-info"
            class="button"
            @click="emit('close-info')">
            close
          </button>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// ======================================================================= Setup
const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
    default: false
  },
  text: {
    type: String,
    required: true,
    default: ''
  }
})

const emit = defineEmits(['close-info'])
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.info-content {
  position: absolute;
  padding-left: calc(33.5% + 1rem);
  margin-top: torem(365);
  z-index: 1;
  @include small {
    margin-top: torem(210);
    padding-left: calc(33.5% + 1rem - torem(48));
  }
  &.high-z {
    z-index: 10;
  }
}

.text {
  line-height: 1.7;
  font-weight: 400;
  margin-bottom: 2rem;
  font-size: torem(16);
  @include small {
    font-size: torem(15);
  }
}

#close-info {
  font-weight: 500;
  transition: letter-spacing 200ms ease;
  &:hover {
    letter-spacing: 4px;
  }
}

.info-panel {
  visibility: hidden;
  transition: 500ms ease 300ms;
  opacity: 0;
  @include small {
    padding-left: 1rem;
  }
  @include mini {
    padding-left: 0;
  }
  &.visible {
    visibility: visible;
    opacity: 1;
  }
}
</style>
