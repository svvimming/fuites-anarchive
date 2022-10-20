<template>
  <div :class="['pocket-wrapper', { open: pocketIsOpen }]">
    <div class="pocket-container">

      <Irridescence :freq="0.005" />

      <div
        class="pocket"
        @drop="onDrop($event)"
        @dragover.prevent
        @dragenter.prevent>

        <!-- Uploader ********************************************************** -->
        <div class="uploader-wrapper">
          <div class="help-text">
            drag a thingie to move it<br>
            hold shift while dragging to drag and drop
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

    </div>
  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'

import Thingie from '@/components/thingie'
import Irridescence from '@/components/irridescence'
import SingleFileUploader from '@/components/single-file-uploader'

// ====================================================================== Export
export default {
  name: 'Pocket',

  components: {
    Thingie,
    Irridescence,
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
      authenticated: 'general/authenticated',
      pocketIsOpen: 'pocket/pocketIsOpen'
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

      const rect = evt.target.getBoundingClientRect()
      const x = Math.max(0, Math.min(640, evt.clientX - rect.left))
      const y = Math.max(0, Math.min(400, evt.clientY - rect.top))

      const thingieId = evt.dataTransfer.getData('_id')
      this.socket.emit('update-thingie', {
        _id: thingieId,
        location: 'pocket',
        dragging: false,
        at: { x, y, z: 1 }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
// ////////////////////////////////////////////////////////////////////// Pocket
.pocket-wrapper {
  z-index: -1;
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  width: auto;
  height: auto;
  transition: 250ms ease;
  transform: scale(0.8);
  opacity: 0;
  &.open {
    transform: scale(1);
    opacity: 1;
    z-index: 100;
  }
}

.pocket-container {
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  z-index: 1;
  padding: 1rem;
  height: 27rem;
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(white, 0.85);
    z-index: -2;
  }
}

.pocket {
  position: relative;
  width: 40rem;
  height: 25rem;
  z-index: 1;
}

:deep(.turbulence-bg) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  opacity: 0.66;
}

.pocket-height-toggle {
  position: absolute;
  top: 1rem;
  left: 1rem;
  color: white;
}

// ///////////////////////////////////////////////////////////////////// Thingie
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

// //////////////////////////////////////////////////////////////////// Uploader
.uploader-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  width: 33%;
  padding: 1rem;
  margin-left: auto;
  color: rgba(black, 0.7);
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 1000;
}

.help-text {
  @include fontFamily_Merriweather;
  @include fontSize_Main;
  margin-bottom: 1rem;
}

</style>
