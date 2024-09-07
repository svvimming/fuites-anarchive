<template>
  <div class="page error general">

    <div class="status-message h1">
      {{ error.statusMessage }}
    </div>
    <div class="url">
      {{ error.url }}
    </div>
    <div class="message">
      {{ error.message }}
    </div>

    <div class="container">
      <span class="code">{{ error.statusCode }}</span>
      <div class="stack" v-html="error.stack" />
    </div>

  </div>
</template>


<script setup>
// ======================================================================== Data
defineProps({
  error: {
    type: Object,
    required: true
  }
})
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.page {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: toRem(20);
}

.status-message {
  margin-bottom: toRem(8);
}

.message {
  margin-top: toRem(16);
  font-weight: 500;
  padding: toRem(6) toRem(12);
}

.container {
  position: relative;
  margin-top: 3rem;
  border: 2px solid tomato;
  border-radius: toRem(12);
}

.code {
  position: absolute;
  top: 0;
  left: toRem(12);
  padding: toRem(6) toRem(12);
  background-color: teal;
  border: 2px solid tomato;
  font-size: toRem(22);
  font-weight: 700;
  transform: translateY(-50%);
  border-radius: toRem(8);
}

.stack {
  :deep(pre) {
    font-family: monospace;
    margin: 0;
    padding-top: 2rem;
    font-size: toRem(14);
  }
}
</style>
