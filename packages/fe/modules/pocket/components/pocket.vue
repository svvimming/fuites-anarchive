<template>
  <div
    class="pocket"
    @drop="onDrop($event)"
    @dragover.prevent
    @dragenter.prevent>

    <div class="help-me">
      <div class="text">
        Drag items to reposition<br>
        Hold shift while dragging to drag and drop
      </div>
      <SingleFileUploader />
    </div>

    <template v-for="thingie in pocketThingies">

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
import SingleFileUploader from '@/components/single-file-uploader'

// ====================================================================== Export
export default {
  name: 'Pocket',

  components: {
    Thingie,
    SingleFileUploader
  },

  data () {
    return {
      socket: false
    }
  },

  computed: {
    ...mapGetters({
      thingies: 'collections/thingies',
      authenticated: 'general/authenticated'
    }),
    pocketThingies () {
      return this.thingies.filter(obj => obj.location === 'pocket')
    }
  },

  async mounted () {
    await this.$connectWebsocket(this, () => {
      this.socket.emit('join-room', 'thingies')
      this.socket.on('module|update-thingie|payload', (thingie) => {
        this.updateThingie(thingie)
      })
      this.socket.on('module|post-create-thingie|payload', (thingie) => {
        this.addThingie(thingie)
      })
    })
  },

  methods: {
    ...mapActions({
      updateThingie: 'collections/updateThingie',
      addThingie: 'collections/addThingie'
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
      console.log('onDrop — pocket')
      evt.preventDefault()
      const thingieId = evt.dataTransfer.getData('_id')
      this.socket.emit('update-thingie', {
        _id: thingieId,
        location: 'pocket',
        dragging: false
      })
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

.help-me {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  position: relative;
  width: 100%;
  padding: 1rem;
  text-align: center;
  color: rgba(black, 0.7);
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 1000;
}
</style>
