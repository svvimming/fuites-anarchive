<template>
  <div class="spinner active">
    <div class="spinner-layer">

      <!-- The divs below MUST NOT contain a newline after their closing tags -->

      <div class="circle-clipper left">
        <div class="circle"></div>
      </div><div class="gap-patch">
        <div class="circle"></div>
      </div><div class="circle-clipper right">
        <div class="circle"></div>
      </div>

    </div>
  </div>
</template>

<script>
// ====================================================================== Export
export default {
  name: 'MaterialCircle'
}
</script>

<style lang="scss" scoped>
@keyframes container-rotate {
  to { transform: rotate(360deg) }
}

@-webkit-keyframes fill-unfill-rotate {
  12.5% { -webkit-transform: rotate(135deg);  } /* 0.5 * ARCSIZE */
  25%   { -webkit-transform: rotate(270deg);  } /* 1   * ARCSIZE */
  37.5% { -webkit-transform: rotate(405deg);  } /* 1.5 * ARCSIZE */
  50%   { -webkit-transform: rotate(540deg);  } /* 2   * ARCSIZE */
  62.5% { -webkit-transform: rotate(675deg);  } /* 2.5 * ARCSIZE */
  75%   { -webkit-transform: rotate(810deg);  } /* 3   * ARCSIZE */
  87.5% { -webkit-transform: rotate(945deg);  } /* 3.5 * ARCSIZE */
  to    { -webkit-transform: rotate(1080deg); } /* 4   * ARCSIZE */
}

@keyframes left-spin {
  from { transform: rotate(130deg); }
  50% { transform: rotate(-5deg); }
  to { transform: rotate(130deg); }
}

@keyframes right-spin {
  from { transform: rotate(-130deg); }
  50% { transform: rotate(5deg); }
  to { transform: rotate(-130deg); }
}

// ///////////////////////////////////////////////////////////////////// General
.spinner {
  display: inline-block;
  position: relative;
  width: 20px;
  height: 20px;
  color: white;
  animation: container-rotate 1568ms linear infinite;
}

.spinner-layer {
  position: absolute;
  width: 100%;
  height: 100%;
  border-color: currentColor;
  animation: fill-unfill-rotate 5332ms cubic-bezier(0.4, 0.0, 0.2, 1) infinite both;
}

// ///////////////////////////////////////////////////////////////////// Circles
.gap-patch {
  position: absolute;
  top: 0;
  left: 45%;
  width: 10%;
  height: 100%;
  overflow: hidden;
  border-color: inherit;
  .circle {
    width: 1000%;
    left: -450%;
  }
}

.circle-clipper {
  display: inline-block;
  position: relative;
  width: 50%;
  height: 100%;
  overflow: hidden;
  border-color: inherit;
  .circle {
    width: 200%;
    height: 100%;
    border-width: 2px; /* STROKEWIDTH */
    border-style: solid;
    border-color: inherit;
    border-bottom-color: transparent !important;
    border-radius: 50%;
    -webkit-animation: none;
    animation: none;
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
  }
  &.left .circle {
    left: 0;
    border-right-color: transparent !important;
    -webkit-transform: rotate(129deg);
    transform: rotate(129deg);
    animation: left-spin 1333ms cubic-bezier(0.4, 0.0, 0.2, 1) infinite both;
  }
  &.right .circle {
    left: -100%;
    border-left-color: transparent !important;
    -webkit-transform: rotate(-129deg);
    transform: rotate(-129deg);
    animation: right-spin 1333ms cubic-bezier(0.4, 0.0, 0.2, 1) infinite both;
  }
}
</style>
