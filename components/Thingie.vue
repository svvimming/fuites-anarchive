<template>
  <div @click="clickHandler">

    <slot />

  </div>
</template>

<script>
export default {
  name: 'Thingie',

  props: {
    data: {
      type: Object,
      required: true,
      default: () => ({})
    }
  },

  methods: {
    clickHandler () {
      this.$emit('clicked')
    }
  }
}
</script>
