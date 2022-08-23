<template>
  <div>
  </div>
</template>

<script>
// ====================================================================== Export
export default {
  name: 'Index',

  layout: 'spaze',

  async fetch ({ app, store }) {
    await store.dispatch('pocket/retrieveThingies')
  }
}
</script>
