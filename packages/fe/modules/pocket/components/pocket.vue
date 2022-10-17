<template>
  <div :class="['pocket-wrapper', { open: pocketIsOpen }]">
    <div class="pocket-container">

      <div
        class="pocket"
        @drop="onDrop($event)"
        @dragover.prevent
        @dragenter.prevent>

        <!-- Irridescent background ******************************************** -->
        <svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" class="turbulence-bg">
          <filter id="filter">
              <feTurbulence result="1" x="0" y="0%" width="100%" height="100%" baseFrequency="0.01"/>
              <feMerge>
                  <feMergeNode in="1"/>
              </feMerge>
          </filter>
          <rect width="100%" height="100%" filter="url(#filter)"/>
        </svg>

        <!-- Uploader ********************************************************** -->
        <div class="help-me">
          <div class="text">
            Drag items to reposition<br>
            Hold shift while dragging to drag and drop
          </div>
          <SingleFileUploader />
        </div>

        <!-- Thingies ********************************************************** -->
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
.pocket-wrapper {
  z-index: 100;
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
  }
}

.pocket-container {
  position: relative;
  overflow: hidden;
  border-radius: 4px;
}

.pocket {
  position: relative;
  height: 100%;
  width: 40rem;
  height: 25rem;
}

.turbulence-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
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
