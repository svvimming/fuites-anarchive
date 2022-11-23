<template>
  <div
    class="spz"
    @drop="onDrop($event)"
    @dragover.prevent
    @dragenter.prevent
    @click.alt.self="openEditor($event)"
    @click.self="closeEditor($event)">

    <div
      :class="['editor', { open: editor.open }]"
      :style="{ left: editor.left + 'px', top: editor.top + 'px' }">
      <form>
        <textarea />
        <input type="submit" />
      </form>
    </div>

    <template v-for="thingie in spazeThingies">

      <Thingie
        :thingie="thingie"
        @initmousedown="initMousedown"
        @initupdate="initUpdate"
        @initmouseup="initMouseup">
        <img :src="`${$config.backendUrl}/${thingie.file_ref._id}.${thingie.file_ref.file_ext}`" />
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
  name: 'Portal',

  layout: 'spaze',

  components: {
    Thingie
  },

  async fetch ({ app, store }) {
    await store.dispatch('collections/getThingies')
  },

  data () {
    return {
      socket: false,
      editor: { open: false }
    }
  },

  computed: {
    ...mapGetters({
      thingies: 'collections/thingies',
      authenticated: 'general/authenticated'
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

  beforeDestroy () {
    this.clearThingies()
  },

  methods: {
    ...mapActions({
      updateThingie: 'collections/updateThingie',
      clearThingies: 'collections/clearThingies'
    }),
    initMousedown (thingie) {
      this.socket.emit('update-thingie', {
        _id: thingie._id,
        dragging: true
      })
    },
    initMouseup (thingie) {
      this.socket.emit('update-thingie', {
        _id: thingie._id,
        dragging: false
      })
    },
    initUpdate (thingie) {
      this.socket.emit('update-thingie', thingie)
    },
    onDrop (evt) {
      if (this.authenticated) {
        evt.preventDefault()
        const rect = evt.target.getBoundingClientRect()
        const x = evt.clientX - rect.left
        const y = evt.clientY - rect.top
        const thingieId = evt.dataTransfer.getData('_id')
        this.socket.emit('update-thingie', {
          _id: thingieId,
          location: 'spaze',
          dragging: false,
          at: { x, y, z: 1 }
        })
      }
    },
    openEditor (evt) {
      this.editor = {
        open: true,
        left: evt.clientX,
        top: evt.clientY
      }
    },
    closeEditor (evt) {
      console.log(evt)
      if (this.editor.open && !evt.altKey) {
        this.editor = {
          open: false
        }
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
  overflow: scroll;
  z-index: 1;
}

.editor {
  position: absolute;
  border: 1px solid black;
  visibility: hidden;
  &.open {
    visibility: visible;
  }
}

</style>
