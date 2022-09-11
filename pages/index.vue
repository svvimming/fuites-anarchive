<template>
  <div
    class="spz"
    @drop="onDrop($event)"
    @dragover.prevent
    @dragenter.prevent>

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
  name: 'Index',

  layout: 'spaze',

  components: {
    Thingie
  },

  async fetch ({ app, store }) {
    await store.dispatch('collections/retrieveThingies')
  },

  data () {
    return {
      zone: 'spaze'
    }
  },

  computed: {
    ...mapGetters({
      thingies: 'collections/spazeThingies'
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
// ///////////////////////////////////////////////////////////////////// General
.spz {
  position: relative;
  height: 100%;
  width: 100%;
}

.test-drop-zone {
  position: absolute;
  width: 500px;
  height: 520px;
  bottom: 100px;
  left: 50px;
  background-color: rgba(0, 0, 255, 0.1);
}

.image {
  width: 160px;
}
</style>
