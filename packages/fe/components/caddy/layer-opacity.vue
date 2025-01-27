<template>
  <div class="layer-opacity-tool">

    <div class="panel opacity-tool"></div>

    <div class="panel layer-tool">
      <button
        class="layer-button"
        @click="emit('bring-forward')">
        <IconLayerUpButton />
      </button>
      <button
        class="layer-button"
        @click="emit('send-back')">
        <IconLayerDownButton />
      </button>
    </div>

    <ButtonIcon
      :force-disabled="true"
      class="layer-opacity-icon solid-outline">
      <IconLayerOpacityInverse class="icon" />
    </ButtonIcon>
    
  </div>
</template>

<script setup>
// ======================================================================= Setup
const emit = defineEmits(['send-back', 'bring-forward'])
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.layer-opacity-tool {
  display: flex;
  justify-content: center;
  align-items: center;
  width: torem(152);
  height: torem(152);
}

.panel {
  width: 50%;
}

.layer-tool {
  display: flex;
  flex-direction: column;
}

.layer-button {
  display: flex;
  width: fit-content;
  padding: torem(2) torem(3);
}

.layer-opacity-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  width: torem(52);
  height: torem(52);
  transform: translate(-50%, -50%);
  --two-tone-a: #{$stormGray};
  --two-tone-b: white;
}
</style>
