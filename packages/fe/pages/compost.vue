<template>
  <div
    ref="compost"
    class="compost"
    @drop="onDrop($event)"
    @dragover.prevent
    @dragenter.prevent>

    <Thingie
      v-for="thingie in compostThingies"
      :key="thingie._id"
      :thingie="thingie"
      :bounds="compostBounds"
      @initmousedown="initMousedown"
      @initupdate="initUpdate"
      @initmouseup="initMouseup" />

  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'

import Thingie from '@/components/thingies/thingie'

// ====================================================================== Export
export default {
  name: 'Compost',

  layout: 'spaze',

  components: {
    Thingie
  },

  async fetch ({ app, store }) {
    await store.dispatch('general/setLandingData')
    await store.dispatch('collections/getSpazes')
    await store.dispatch('collections/getThingies')
  },

  head () {
    return {
      title: 'compost - f u i t e s'
    }
  },

  data () {
    return {
      socket: false
    }
  },

  computed: {
    ...mapGetters({
      spazes: 'collections/spazes',
      thingies: 'collections/thingies',
      authenticated: 'general/authenticated',
      landing: 'general/landing',
      pocket: 'pocket/pocket',
    }),
    compost () {
      const compost = this.spazes.find(item => item.name === 'compost')
      return compost
    },
    compostThingies () {
      if (this.compost) {
        return this.thingies.filter(obj => obj.location === 'compost')
      }
      return []
    },
    compostBounds () {
      return this.compost && this.compost.bounds ? this.compost.bounds : { x: 2732, y: 2000 }
    },
  },

  async mounted () {
    await this.$connectWebsocket(this, () => {
      this.socket.emit('join-room', 'thingies')
    })
  },

  methods: {
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
      if (this.authenticated && this.compost) {
        evt.preventDefault()
        const rect = evt.target.getBoundingClientRect()
        const x = evt.clientX - rect.left
        const y = evt.clientY - rect.top
        const thingieId = evt.dataTransfer.getData('_id')
        this.socket.emit('update-thingie', {
          _id: thingieId,
          location: 'compost',
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
// ///////////////////////////////////////////////////////////////////// General
.compost {
  position: absolute;
  width: 1366px;
  height: 1000px;
  overflow: hidden;
  z-index: 1;
}
</style>
