<template>
  <div
    id="floating-editor"
    :class="{ active: id }"
    :style="{
      left: `${(rect.x + sceneData.x - 6) * sceneData.scale - rect.width * 0.5}px`,
      top: `${(rect.y + sceneData.y + 6) * sceneData.scale - rect.height * 0.5}px`,
      transform: `scale(${sceneData.scale}) rotate(${rotation}deg)`,
      '--highlight-color': highlight
    }">
    
  </div>
</template>
