<template>
  <div :class="['compost-portal-wrapper', { open: compostPortalIsOpen }]">
    <div class="compost-portal-container">

      <Shader
        id="compost-portal-shader"
        :image="wormhole"
        :pulse="0.3"
        :exposure="0.48" />

      <div
        class="compost-portal"
        @drop="onCompost($event)"
        @dragover.prevent
        @dragenter.prevent>
      </div>

    </div>
  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'

import Shader from '@/components/shader'
// ====================================================================== Export
export default {
  name: 'CompostDropzone',

  components: {
    Shader
  },

  data () {
    return {
      socket: false,
      wormhole: {
        src: '/portal/compost-portal.png',
        width: 320 * 1.5,
        height: 224 * 1.5
      }
    }
  },

  computed: {
    ...mapGetters({
      compostPortalIsOpen: 'compost/compostPortalIsOpen',
      thingies: 'collections/thingies',
      pocket: 'pocket/pocket'
    })
  },

  async mounted () {
    await this.$connectWebsocket(this, () => {
      this.socket.emit('join-room', `${this.$config.mongoInstance}|thingies`)
    })
  },

  methods: {
    ...mapActions({
      postDeleteThingie: 'collections/postDeleteThingie',
      removeThingie: 'collections/removeThingie'
    }),
    onCompost (evt) {
      evt.preventDefault()
      const thingieId = evt.dataTransfer.getData('_id')
      const thingie = this.thingies.find(obj => obj._id === thingieId)
      this.socket.emit(`${this.$config.mongoInstance}|update-thingie`, {
        _id: thingieId,
        location: 'compost',
        last_update_token: this.pocket.token,
        dragging: false,
        at: {
          x: thingie.at.x - window.scrollX,
          y: thingie.at.y - window.scrollY,
          z: 1
        },
        record_new_location: true
      })
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// Compost
.compost-portal-wrapper {
  z-index: -1;
  position: fixed;
  left: 1rem;
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

.compost-portal-container {
  position: relative;
  overflow: hidden;
  border-radius: 56% 44% 57% 43% / 50% 58% 42% 50%;
  z-index: 1;
  padding: 1rem;
  height: 16rem;
}

.compost-portal {
  // cursor: pointer;
  position: relative;
  height: 14rem;
  width: 22rem;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

#compost-portal-shader {
  position: absolute;
  top: -2rem;
  left: -2rem;
  z-index: -1;
}

</style>
