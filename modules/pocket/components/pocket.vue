<template>
  <div
    class="pocket"
    @drop="onDrop($event)"
    @dragover.prevent
    @dragenter.prevent>

    <div class="help-me">
      Drag items to reposition<br>
      Hold shift while dragging to drag and drop
    </div>

    <template v-for="thingie in thingies">

      <Thingie
        :consistency="thingie.consistency"
        :location="thingie.current_location">
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
      thingies: 'collections/pocketThingies'
    })
  },

  methods: {
    ...mapActions({
      moveThingie: 'collections/moveThingie'
    }),
    onDrop (evt) {
      evt.preventDefault()
      const consistency = evt.dataTransfer.getData('consistency')
      const origin = evt.dataTransfer.getData('location')
      if (origin !== this.zone) {
        this.moveThingie({
          consistency,
          current_location: origin,
          new_location: this.zone
        })
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

.help-me {
  width: 100%;
  text-align: center;
  color: rgba(black, 0.7);
}
</style>
