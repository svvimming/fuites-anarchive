<template>
  <div
    class="pocket"
    @drop="onDrop($event)"
    @dragover.prevent
    @dragenter.prevent>

    <template v-for="thingie in thingies">

      <Thingie
        :consistency="thingie.consistency"
        :location="thingie.current_location.spaze">
        <img
          slot-scope="{ mousedown, startDrag, styles }"
          :src="thingie.props.src"
          class="thingie image"
          :style="styles"
          @mousedown="mousedown"
          draggable
          @dragstart="startDrag($event)" />
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

  data () {
    return {
      zone: 'pocket'
    }
  },

  computed: {
    ...mapGetters({
      thingies: 'pocket/thingies'
    })
  },

  methods: {
    ...mapActions({
      moveSpazeThingie: 'spaze/moveThingie'
    }),
    onDrop (evt) {
      evt.preventDefault()
      const consistency = evt.dataTransfer.getData('consistency')
      const origin = evt.dataTransfer.getData('location')
      switch (origin) {
        case 'spaze': this.moveSpazeThingie({
          consistency,
          newLocation: this.zone
        }); break
        default : null
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// ////////////////////////////////////////////////////////////////////// Pocket
.pocket {
  position: relative;
  height: 100%;
  width: 100%;
}

.image {
  width: 160px;
}
</style>
