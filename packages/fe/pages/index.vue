<template>
  <div
    class="spz"
    @drop="onDrop($event)"
    @dragover.prevent
    @dragenter.prevent>

    <template v-for="thingie in spazeThingies">

      <Thingie
        :thingie="thingie"
        @drag="initDrag">
        <div
          slot-scope="{ mousedown, mouseup, startDrag, styles }"
          draggable
          class="thingie"
          :style="styles"
          @mousedown="initMousedown($event, mousedown, thingie)"
          @mouseup="initMouseup($event, mouseup, thingie)"
          @dragstart="startDrag($event)">
          {{ thingie.dragging }}
          <img :src="`${$config.backendUrl}/${thingie.file_ref._id}.${thingie.file_ref.file_ext}`" />
        </div>
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
    await store.dispatch('collections/getThingies')
  },

  data () {
    return {
      socket: false
    }
  },

  computed: {
    ...mapGetters({
      thingies: 'collections/thingies'
    }),
    spazeThingies () {
      return this.thingies.filter(obj => obj.location === 'spaze')
    }
  },

  async mounted () {
    await this.$connectWebsocket(this, () => {
      this.socket.emit('join-room', 'thingies')
    })
  },

  methods: {
    ...mapActions({
      updateThingie: 'collections/updateThingie'
    }),
    initMousedown (evt, mousedown, thingie) {
      console.log('initMousedown')
      mousedown(evt)
      this.socket.emit('update-thingie', {
        _id: thingie._id,
        dragging: true
      })
    },
    initMouseup (evt, mouseup, thingie) {
      console.log('initMouseup')
      mouseup(evt)
      this.socket.emit('update-thingie', {
        _id: thingie._id,
        dragging: false
      })
    },
    initDrag (thingie) {
      console.log('initDrag')
      this.socket.emit('update-thingie', {
        _id: thingie._id,
        at: thingie.at
      })
    },
    onDrop (evt) {
      console.log('onDrop — spaze')
      evt.preventDefault()
      const thingieId = evt.dataTransfer.getData('_id')
      this.socket.emit('update-thingie', {
        _id: thingieId,
        location: 'spaze',
        dragging: false
      })
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

.thingie {
  width: 160px;
  cursor: grab;
  &:active {
    cursor: grabbing;
  }
  img {
    width: 100%;
    pointer-events: none;
  }
}
</style>
