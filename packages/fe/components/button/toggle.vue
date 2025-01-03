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
  background-color: #AAAAAA;
  border-radius: torem(12);
  margin-right: torem(12);
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
}

.slot {
  display: flex;
}
</style>
