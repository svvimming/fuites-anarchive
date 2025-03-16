<template>
  <button
    :class="['toggle-button', { active }]"
    @click="emit('clicked')">

    <div class="toggle">
      <div class="thumbnail">

      </div>
    </div>
    
    <div class="slot">
      <slot />
    </div>

  </button>
</template>

<script setup>
// ======================================================================= Setup
const props = defineProps({
  active:  {
    type: Boolean,
    required: false,
    default: false
  }
})
const emit = defineEmits(['clicked'])
</script>

<style lang="scss" scoped>
// /////////////////////////////////////////////////////////////////////// Style
.toggle-button {
  display: flex;
  align-items: center;
  --bg-active-color: #{$effy};
  &.active {
    .toggle {
      background-color: var(--bg-active-color);
    }
    .thumbnail {
      transform: translateX(torem(28));
    }
  }
}

.toggle {
  position: relative;
  width: torem(52);
  height: torem(24);
  transition: 200ms ease;
  background-color: #DFE0E5;
  border-radius: torem(12);
  margin-right: torem(12);
  box-shadow: 0 torem(2) 0 #F6F7FA, inset 0 torem(2) torem(3) rgba(#595555, 0.25);
}

.thumbnail {
  position: absolute;
  left: torem(3);
  top: torem(3);
  width: torem(18);
  height: torem(18);
  border-radius: 50%;
  transform: translateX(0);
  background-color: white;
  transition: 200ms ease;
  box-shadow: inset 0 torem(-2) torem(4) #B2B9CC, 0 torem(1) torem(2) rgba(#262222, 0.25);
}

.slot {
  display: flex;
}
</style>
