<template>
  <svg
    class="svg"
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <rect
      x="1"
      y="1"
      width="38"
      height="38"
      rx="19"
      stroke="#F2A60D"
      stroke-width="2"
      stroke-dasharray="2 4 6  8  2.5  2 4 1.5" />
  </svg>
</template>

<style lang="scss" scoped>
.svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

path {
  transition: 200ms ease;
}

// 4 8 12 16 5    4 8 3   (original)
// 2 4 6  8  2.5  2 4 1.5 (1/2)
// 3 6 9  12 3.75 3 6 2   (3/4)
</style>
