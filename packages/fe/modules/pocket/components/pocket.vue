<template>
  <div :class="['pocket-wrapper', { open: pocketIsOpen }]">
    <div class="pocket-container">

      <Shader
        id="pocket-shader"
        :image="turbulence"
        :pulse="0.3"
        :exposure="0.3" />

      <div
        class="pocket"
        @drop="onDrop($event)"
        @dragover.prevent
        @dragenter.prevent>

        <!-- Uploader ****************************************************** -->
        <div class="uploader-wrapper">
          <SingleFileUploader />
        </div>

        <Thingie
          v-for="thingie in pocketThingies"
          :key="thingie._id"
          :thingie="thingie"
          @initmousedown="initMousedown"
          @initupdate="initUpdate"
          @initmouseup="initMouseup" />

      </div>

    </div>
  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'

import Thingie from '@/components/thingies/thingie'
import Shader from '@/components/shader'
import SingleFileUploader from '@/modules/pocket/components/single-file-uploader'

// ====================================================================== Export
export default {
  name: 'Pocket',

  components: {
    Thingie,
    Shader,
    SingleFileUploader
  },

  data () {
    return {
      socket: false,
      turbulence: {
        src: '/portal/turbulence.png',
        width: 800,
        height: 500
      }
    }
  },

  computed: {
    ...mapGetters({
      thingies: 'collections/thingies',
      authenticated: 'general/authenticated',
      pocket: 'pocket/pocket',
      pocketIsOpen: 'pocket/pocketIsOpen'
    }),
    pocketThingies () {
      return this.thingies.filter(obj => obj.location === 'pocket' && this.pocket.thingies.includes(obj._id))
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
    initMousedown (thingie) {
      this.socket.emit('update-thingie', {
        _id: thingie._id,
        dragging: true,
        last_update_token: this.pocket.token
      })
    },
    initMouseup (thingie) {
      this.socket.emit('update-thingie', {
        _id: thingie._id,
        dragging: false,
        last_update_token: this.pocket.token
      })
    },
    initUpdate (thingie) {
      thingie.last_update_token = this.pocket.token
      this.socket.emit('update-thingie', thingie)
    },
    onDrop (evt) {
      if (this.authenticated) {
        evt.preventDefault()
        const rect = evt.target.getBoundingClientRect()
        const x = Math.max(0, Math.min(640, evt.clientX - rect.left))
        const y = Math.max(0, Math.min(400, evt.clientY - rect.top))
        const thingieId = evt.dataTransfer.getData('_id')
        this.socket.emit('update-thingie', {
          _id: thingieId,
          location: 'pocket',
          last_update_token: this.pocket.token,
          dragging: false,
          at: { x, y, z: 1 },
          record_new_location: true
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
$pocketWidth: 42rem;
$pocketHeight: 30rem;
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
  border-radius: 50%;
  z-index: 1;
  width: $pocketWidth;
  height: $pocketHeight;
}

.pocket {
  position: relative;
  z-index: 1;
  width: $pocketWidth;
  height: $pocketHeight;
}

#pocket-shader {
  position: absolute;
  z-index: -1;
  opacity: 0.66;
  width: $pocketWidth;
  height: $pocketHeight;
  :deep(.glCanvas) {
    width: calc($pocketWidth + 10rem);
    height: calc($pocketHeight + 10rem);
    transform: translate(-5rem, -5rem);
  }
}

.pocket-height-toggle {
  position: absolute;
  top: 1rem;
  left: 1rem;
  color: white;
}

// //////////////////////////////////////////////////////////////////// Uploader
.uploader-wrapper {
  position: absolute;
  top: 3rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 1rem;
  margin-left: auto;
  color: black;
  z-index: 10000;
}

.thingie {
  z-index: 1000;
}

</style>
