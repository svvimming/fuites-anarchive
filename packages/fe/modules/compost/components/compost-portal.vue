<template>
  <div :class="['compost-portal-wrapper', { open: compostPortalIsOpen }]">
    <div class="compost-portal-container">

      <!-- <Irridescence :freq="0.00025" /> -->

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

// import Irridescence from '@/components/irridescence'
import Shader from '@/components/shader'
// ====================================================================== Export
export default {
  name: 'CompostDropzone',

  components: {
    // Irridescence
    Shader
  },

  data () {
    return {
      wormhole: {
        src: '/portal/compost-portal.png',
        width: 320 * 1.5,
        height: 224 * 1.5
      }
    }
  },

  computed: {
    ...mapGetters({
      compostPortalIsOpen: 'compost/compostPortalIsOpen'
    })
  },

  async mounted () {
    await this.$connectWebsocket(this, () => {
      this.socket.emit('join-room', 'thingies')
      this.socket.on('module|post-delete-thingie|payload', (thingieId) => {
        this.removeThingie(thingieId)
      })
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
      this.deleteThingie (thingieId)
    },
    async deleteThingie (id) {
      const deleted = await this.postDeleteThingie({ id })
      console.log(deleted)
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// Compost
.compost-portal-wrapper {
  z-index: -1;
  position: absolute;
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

:deep(.turbulence-bg) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  opacity: 0.66;
  transform: scale(2.5) rotate(25deg);
}

.compost-portal {
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
}

</style>
