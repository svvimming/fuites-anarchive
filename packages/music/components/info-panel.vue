<template>
  <div :class="['info-content', { 'high-z': visible }]">
    <div class="grid full">
      <div
        class="col-6"
        data-push-left="off-1">
        <div :class="['info-panel', { visible }]">

          <div class="text">
            {{ text }}
          </div>

          <button
            id="close-info"
            class="button"
            @click="$emit('close-info')">
            close
          </button>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InfoPanel',

  props: {
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
  }
}
</script>

<style lang="scss" scoped>
.info-content {
  position: absolute;
  padding-left: calc(33.5% + 1rem);
  margin-top: min(toRem(419), calc(59.5vh - 14rem));
  z-index: 1;
  &.high-z {
    z-index: 10;
  }
}

.text {
  line-height: 1.7;
  font-weight: 400;
  margin-bottom: 2rem;
}

#close-info {
  font-weight: 500;
}

.info-panel {
  visibility: hidden;
  transition: 500ms ease 300ms;
  opacity: 0;
  &.visible {
    visibility: visible;
    opacity: 1;
  }
}
</style>