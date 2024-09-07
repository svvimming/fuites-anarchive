<template>
  <div class="page error">

    <SiteHeader />

    <div class="grid">
      <div class="col-6" data-push-left="off-2">
        <div class="content">

          <h1 class="heading">
            {{ statusCode }}
          </h1>

          <div class="message">
            {{ displayMessage }}
          </div>

          <pre v-if="stack && stack !== ''"><code>{{ stack }}</code></pre>

        </div>
      </div>
    </div>

    <SiteFooter />

  </div>
</template>

<script setup>
// ======================================================================== Data
const props = defineProps({
  statusCode: {
    type: Number,
    required: false,
    default: 404
  },
  message: {
    type: String,
    required: false,
    default: 'This page doesn\'t exist.'
  },
  stack: {
    type: String,
    required: false,
    default: ''
  },
  data: {
    type: [Object, String],
    required: false,
    default: () => {}
  }
})

// ==================================================================== Computed
const displayMessage = computed(() => {
  return props.statusCode === 404 ?
    'This page doesn\'t exist.' :
    props.message
})
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.heading {
  @include h1;
  font-size: toRem(100);
  line-height: 1;
  color: var(--link-color);
  margin-bottom: 2rem;
}

.message {
  @include h3;
  transition: color 500ms;
}
</style>
