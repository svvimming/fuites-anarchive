<template>
  <div :class="['hamburger', { open }]">

    <div
      class="line top">
    </div>

    <div
      class="line middle">
    </div>

    <div
      class="line bottom">
    </div>

  </div>
</template>

<script setup>
defineProps({
  open: {
    type: Boolean,
    required: false,
    default: false
  }
})
</script>

<style lang="scss" scoped>
.hamburger {
  position: relative;
  &.open {
    .top {
      top: 50%;
      transform: translateY(-50%) rotate(45deg);
    }
    .middle {
      width: 0;
    }
    .bottom {
      bottom: 50%;
      transform: translateY(50%) rotate(-45deg);
    }
  }
}

.line {
  position: absolute;
  left: 0;
  width: 100%;
  border-top: solid torem(1) $woodsmoke;
  border-bottom: solid torem(1) $woodsmoke;
  border-radius: torem(1);
  transition: 200ms ease;
}

.top {
  top: 0;
}

.middle {
  top: 50%;
  transform: translateY(-50%);
}

.bottom {
  bottom: 0;
}
</style>
