<template>
  <div
    class="spz"
    @drop="onDrop($event)"
    @dragover.prevent
    @dragenter.prevent
    @click.alt.self="openEditor($event)"
    @click.self="closeEditor($event)">

    <PropBoard
      v-if="authenticated"
      ref="propboard"
      :spz="spazeName"
      :location="editor" />

    <Thingie
      v-for="thingie in spazeThingies"
      :key="thingie._id"
      :thingie="thingie"
      @initmousedown="initMousedown"
      @initupdate="initUpdate"
      @initmouseup="initMouseup" />

  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'

import Thingie from '@/components/thingies/thingie'
import PropBoard from '@/components/prop-board'

// ====================================================================== Export
export default {
  name: 'SpazeIsThePlaze',

  layout: 'spaze',

  components: {
    Thingie,
    PropBoard
  },

  async fetch ({ app, store }) {
    await store.dispatch('general/setLandingData')
    await store.dispatch('collections/getSpazes')
    await store.dispatch('collections/getThingies')
  },

  data () {
    const name = this.$route.params.id
    return {
      spazeName: name,
      socket: false,
      editor: {
        x: 0,
        y: 0
      }
    }
  },

  computed: {
    ...mapGetters({
      spazes: 'collections/spazes',
      thingies: 'collections/thingies',
      authenticated: 'general/authenticated'
    }),
    spaze () {
      const spaze = this.spazes.find(item => item.name === this.spazeName)
      return spaze
    },
    spazeThingies () {
      if (this.spaze) {
        const name = this.spaze.name
        return this.thingies.filter(obj => obj.location === name)
      }
      return []
    }
  },

  async mounted () {
    await this.$connectWebsocket(this, () => {
      this.socket.emit('join-room', 'spazes')
      this.socket.on('module|post-create-spaze|payload', (spaze) => {
        this.addSpaze(spaze)
      })
    })
  },

  methods: {
    ...mapActions({
      updateThingie: 'collections/updateThingie',
      clearSpazes: 'collections/clearSpazes',
      clearThingies: 'collections/clearThingies',
      postCreateSpaze: 'collections/postCreateSpaze',
      addSpaze: 'collections/addSpaze'
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
          location: this.spazeName,
          dragging: false,
          at: { x, y, z: 1 }
        })
        if (this.spaze.state === 'metastable') {
          this.createNewSpazeFromThingie(thingieId)
        }
      }
    },
    openEditor (evt) {
      if (this.authenticated) {
        this.editor = {
          x: evt.clientX,
          y: evt.clientY
        }
        this.$refs.propboard.openEditor()
      }
    },
    closeEditor (evt) {
      if (this.authenticated) {
        if (!evt.altKey) {
          this.$refs.propboard.closeEditor()
        }
      }
    },
    async createNewSpazeFromThingie (thingieId) {
      const complete = await this.postCreateSpaze({
        incomingThingieId: thingieId,
        connections: [this.spazeName]
      })
      if (complete) {
        const newSpaze = this.spazes.find(item => item.name === complete.name)
        if (newSpaze) {
          this.$nextTick(() => {
            this.$router.push({ path: `/${newSpaze.name}` })
          })
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
</style>
