<template>
  <div class="pocket">

    <template v-for="thingie in thingies">

      <Thingie
        v-slot="{ clickHandler }"
        :data="thingie"
        @clicked="takeOut">

        <img :src="thingie.props.src" class="image" />
        
      </Thingie>

    </template>

  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'
import Thingie from '@/components/thingie'
// ====================================================================== Export
export default {
  name: 'Pocket',

  components: {
    Thingie
  },

  computed: {
    ...mapGetters({
      thingies: 'pocket/thingies'
    })
  },

  mounted() {
    console.log(this.thingies)
  },

  methods: {
    takeOut () {
      console.log('hit')
    }
  }
}
</script>

<style lang="scss" scoped>
// ////////////////////////////////////////////////////////////////////// Pocket
.image {
  width: 160px;
}
</style>
