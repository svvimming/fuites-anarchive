<template>
  <div
    ref="spz"
    :class="['spz', {'non-existent': !spazeExists }]"
    :style="spazeStyles"
    @drop="onDrop($event)"
    @dragover.prevent
    @dragenter.prevent
    @click.alt.self="openEditor($event)"
    @click.self="closeEditor($event)">

    <PropBoard
      v-if="authenticated && spazeExists"
      ref="propboard"
      :spz="spazeName"
      :location="editor" />

    <Thingie
      v-for="thingie in spazeThingies"
      :key="thingie._id"
      :thingie="thingie"
      :bounds="spazeBounds"
      @initmousedown="initMousedown"
      @initupdate="initUpdate"
      @initmouseup="initMouseup" />

    <Portal
      v-for="(portal, i) in portals"
      :key="`${portal.name}_${i}`"
      :to="portal" />

  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'

import PropBoard from '@/components/prop-board'
import Thingie from '@/components/thingies/thingie'
import Portal from '@/components/portal'
import Bingo from '@/components/bingo'
import Button from '@/components/button'

// =================================================================== Functions
const initSpazeScrollPosition = (instance) => {
  if (instance.$refs.spz) {
    const bounds = instance.spazeBounds
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    const x = Math.round((bounds.x - vw) / 2)
    const y = Math.round((bounds.y - vh) / 2)
    window.scrollTo(x, y)
    instance.offset = { x, y }
  }
}

const handleUndoCommand = (e, instance) => {
  if ((e.key === 'z' || e.keyCode === 90) && e.metaKey) {
    instance.initUpdate(instance.lastUpdate)
  }
}

// ====================================================================== Export
export default {
  name: 'SpazeIsThePlaze',

  layout: 'spaze',

  components: {
    PropBoard,
    Thingie,
    Portal,
    Bingo,
    Button
  },

  async fetch ({ app, store, route }) {
    await store.dispatch('general/setLandingData')
    await store.dispatch('collections/getSpazes')
    await store.dispatch('collections/getThingies', { spazename: route.params.id })
  },

  data () {
    const name = this.$route.params.id
    return {
      spazeName: name,
      spazeExists: true,
      socket: false,
      offset: {
        x: 0,
        y: 0
      },
      editor: {
        x: 0,
        y: 0
      },
      keydown: false,
      lastUpdate: false,
      updateInterval: false
    }
  },

  head () {
    return {
      title: `${this.spazeName.replaceAll('-', ' ')} - f u i t e s`
    }
  },

  computed: {
    ...mapGetters({
      spazes: 'collections/spazes',
      thingies: 'collections/thingies',
      authenticated: 'general/authenticated',
      showPortals: 'general/portalView',
      landing: 'general/landing',
      pocket: 'pocket/pocket',
      modal: 'general/modal'
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
    },
    portals () {
      const portals = []
      if (this.spaze && this.showPortals) {
        const connections = this.spaze.portal_refs
        connections.forEach((connection) => {
          const vertices = connection.vertices
          if (vertices.a.location === this.spazeName) {
            portals.push({
              name: connection.edge,
              slug: vertices.b.location,
              at: vertices.a.at,
              colors: connection.thingie_ref ? connection.thingie_ref.colors : []
            })
          }
          if (vertices.b.location === this.spazeName) {
            portals.push({
              name: connection.edge,
              slug: vertices.a.location,
              at: vertices.b.at,
              colors: connection.thingie_ref ? connection.thingie_ref.colors : []
            })
          }
        })
      }
      return portals
    },
    spazeBounds () {
      return this.spaze && this.spaze.bounds ? this.spaze.bounds : { x: 2732, y: 2000 }
    },
    spazeStyles () {
      return {
        '--spaze-var-field-width': `${this.spazeBounds.x}px`,
        '--spaze-var-field-height': `${this.spazeBounds.y}px`,
      }
    }
  },

  watch: {
    authenticated (val) {
      if (val && !this.spazeExists) {
        this.openNewSpazeModal()
      }
    }
  },

  async mounted () {
    await this.$connectWebsocket(this, () => {
      this.socket.emit('join-room', 'spazes')
      this.socket.emit('join-room', 'cron|goa')
      this.socket.on('module|post-create-spaze|payload', (spaze) => {
        this.addSpaze(spaze)
      })
      const socketEvents = ['module|post-update-spaze|payload', 'module|spaze-state-update|payload']
      socketEvents.forEach((message) => {
        this.socket.on(message, (spaze) => {
          this.updateSpaze(spaze)
        })
      })
    })
    if (!this.spaze) {
      this.spazeExists = false
    } else {
      this.$nextTick(() => { initSpazeScrollPosition(this) })
      this.keydown = (e) => { handleUndoCommand(e, this) }
      window.addEventListener('keydown', this.keydown)
    }
  },

  beforeDestroy () {
    if (this.keydown) { window.removeEventListener('keydown', this.keydown )}
  },

  methods: {
    ...mapActions({
      updateThingie: 'collections/updateThingie',
      clearSpazes: 'collections/clearSpazes',
      clearThingies: 'collections/clearThingies',
      postCreateSpaze: 'collections/postCreateSpaze',
      postUpdateSpaze: 'collections/postUpdateSpaze',
      addSpaze: 'collections/addSpaze',
      updateSpaze: 'collections/updateSpaze',
      setModal: 'general/setModal'
    }),
    openNewSpazeModal () {
      this.setModal(true)
    },
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
      this.saveLastUpdate(thingie)
    },
    onDrop (evt) {
      if (this.authenticated && this.spaze) {
        evt.preventDefault()
        const rect = evt.target.getBoundingClientRect()
        const x = evt.clientX - rect.left
        const y = evt.clientY - rect.top
        const thingieId = evt.dataTransfer.getData('_id')
        this.socket.emit('update-thingie', {
          _id: thingieId,
          location: this.spazeName,
          last_update_token: this.pocket.token,
          dragging: false,
          at: { x, y, z: 1 },
          record_new_location: true
        })
        if (this.spaze.state === 'metastable') {
          this.createNewSpazeFromThingie(thingieId)
        }
      }
    },
    openEditor (evt) {
      if (this.authenticated && this.spaze) {
        this.editor = {
          x: evt.clientX + window.scrollX,
          y: evt.clientY + window.scrollY
        }
        this.$refs.propboard.openEditor()
      }
    },
    closeEditor (evt) {
      if (this.authenticated && this.spaze) {
        if (!evt.altKey) {
          this.$refs.propboard.closeEditor()
        }
      }
    },
    async createNewSpazeFromThingie (thingieId) {
      const complete = await this.postCreateSpaze({
        creator_thingie: thingieId,
        overflow_spaze: this.spazeName
      })
      if (complete) {
        const created = this.spazes.find(item => item.name === complete.name)
        if (created) {
          this.socket.emit('update-thingie', {
            _id: created.creator_thingie,
            location: created.name,
            last_update_token: created.initiator_token,
            record_new_location: true
          })
          this.$nextTick(() => {
            this.$router.push({ path: `/${created.name}` })
          })
        }
      }
    },
    saveLastUpdate (thingie) {
      if (!this.updateInterval) {
        this.lastUpdate = thingie
        this.updateInterval = true
        setTimeout(() => {
          this.updateInterval = false
        }, 1500)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.spz {
  --spaze-var-field-width: 2732px;
  --spaze-var-field-height: 2000px;
  position: absolute;
  width: var(--spaze-var-field-width);
  height: var(--spaze-var-field-height);
  overflow: hidden;
  z-index: 1;
  &.non-existent {
    width: 100vw !important;
    height: 100vh !important;
  }
}

</style>
