<template>
  <div
    ref="compost"
    class="compost"
    @drop="onDrop($event)"
    @dragover.prevent
    @dragenter.prevent>

    <!-- <Shader
      id="compost-shader"
      :image="irridescent"
      :pulse="0.3"
      :exposure="0.48" /> -->

    <TouchEditor 
      v-if="touchmode && compost"
      :thingie="editorThingie"
      current-spaze="compost"
      @initupdate="initUpdate"
      @close-editor="clearEditorThingie" />

    <template v-for="thingie in compostThingies">
      <component
        :is="thingieComponent"
        :key="thingie._id"
        :thingie="thingie"
        :bounds="compostBounds"
        @initmousedown="initMousedown"
        @initupdate="initUpdate"
        @initmouseup="initMouseup" />
    </template>

  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'

import Thingie from '@/components/thingies/thingie'
import TouchThingie from '@/components/thingies/touch-thingie'
import TouchEditor from '@/components/thingies/touch-editor'
import Shader from '@/components/shader'

// ====================================================================== Export
export default {
  name: 'Compost',

  layout: 'spaze',

  components: {
    Thingie,
    TouchThingie,
    TouchEditor,
    Shader
  },

  async fetch ({ app, store }) {
    await store.dispatch('general/setLandingData')
    await store.dispatch('collections/getSpazes')
    await store.dispatch('collections/getThingies', { spazename: 'compost' })
  },

  head () {
    return {
      title: 'compost - f u i t e s'
    }
  },

  data () {
    return {
      socket: false,
      irridescent: {
        src: '/portal/compost3.png',
        width: 2004,
        height: 1240
      }
    }
  },

  computed: {
    ...mapGetters({
      spazes: 'collections/spazes',
      thingies: 'collections/thingies',
      authenticated: 'general/authenticated',
      landing: 'general/landing',
      touchmode: 'general/touchmode',
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
    thingieComponent () {
      return this.touchmode ? 'TouchThingie' : 'Thingie'
    }
  },

  async mounted () {
    await this.$connectWebsocket(this, () => {
      this.socket.emit('join-room', 'thingies')
    })
  },

  methods: {
    ...mapActions({
      clearEditorThingie: 'collections/clearEditorThingie'
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
  left: calc(50vw - 683px);
  width: 1366px;
  height: 1000px;
  z-index: 1;
}

#compost-shader {
  position: absolute;
  top: -7.5rem;
  left: -18rem;
  width: calc(100% + 15rem);
  height: calc(100% + 15rem);
  opacity: 0.5;
}
</style>
