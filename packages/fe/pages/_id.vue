<template>
  <div
    ref="page"
    :class="['page', {'non-existent': !pageExists }]"
    :style="pageStyles"
    @drop="onDrop($event)"
    @dragover.prevent
    @dragenter.prevent
    @click.alt.self="openEditor($event)"
    @click.self="closeEditor($event)">

    <button @click="generateScreenShot" class="screencap">
      screencap
    </button>

    <CssBreakoutBox
      v-if="authenticated && !touchmode"
      :active="breakout"
      @update-css-properties="initUpdate" />

    <PropBoard
      v-if="authenticated && pageExists && !touchmode"
      ref="propboard"
      :pagename="pageName"
      :location="editorCoords" />

    <template v-for="thingie in pageThingies">
      <component
        :is="thingieComponent"
        :key="thingie._id"
        :thingie="thingie"
        :bounds="pageBounds"
        @initmousedown="initMousedown"
        @initupdate="initUpdate"
        @initmouseup="initMouseup" />
    </template>

    <Portal
      v-for="(portal, i) in portals"
      :key="`${portal.name}_${i}`"
      :to="portal" />

<!--     <button
      v-if="authenticated && touchmode"
      class="toggle prop-board-toggle"
      @click="toggleEditor">
      prop-board
    </button> -->

  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'
import Html2Canvas from 'html2canvas'

import PropBoard from '@/components/prop-board'
import Thingie from '@/components/thingies/thingie'
import TouchThingie from '@/components/thingies/touch-thingie'
import Portal from '@/components/portal'
import CssBreakoutBox from '@/components/css-breakout-box'

// =================================================================== Functions
const initPageScrollPosition = (instance) => {
  if (instance.$refs.page) {
    const bounds = instance.pageBounds
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    const x = Math.round((bounds.x - vw) / 2)
    const y = Math.round((bounds.y - vh) / 2)
    window.scrollTo(x, y)
    instance.offset = { x, y }
  }
}

const handleKeyCommand = (e, instance) => {
  if ((e.key === 'z' || e.keyCode === 90) && e.metaKey) {
    instance.initUpdate(instance.lastUpdate)
  }
  if ((e.key === 'i' || e.keyCode === 73) && e.metaKey) {
    instance.breakout = !instance.breakout
  }
}

// ====================================================================== Export
export default {
  name: 'Page',

  layout: 'page',

  components: {
    PropBoard,
    Thingie,
    TouchThingie,
    Portal,
    CssBreakoutBox
  },

  async fetch ({ app, store, route }) {
    await store.dispatch('general/setLandingData')
    await store.dispatch('collections/getPages')
    await store.dispatch('collections/getThingies', { pagename: route.params.id })
  },

  data () {
    const name = this.$route.params.id
    return {
      pageName: name,
      pageExists: true,
      socket: false,
      offset: {
        x: 0,
        y: 0
      },
      editorCoords: {
        x: 0,
        y: 0
      },
      keydown: false,
      lastUpdate: false,
      updateInterval: false,
      breakout: false,
      backgroundImage: ''
    }
  },

  head () {
    return {
      title: `${this.pageName.replaceAll('-', ' ')} - f u i t e s`
    }
  },

  computed: {
    ...mapGetters({
      pages: 'collections/pages',
      thingies: 'collections/thingies',
      authenticated: 'general/authenticated',
      showPortals: 'general/portalView',
      landing: 'general/landing',
      pocket: 'pocket/pocket',
      modal: 'general/modal',
      touchmode: 'general/touchmode'
    }),
    page () {
      return this.pages.find(item => item.name === this.pageName)
    },
    pageThingies () {
      if (this.page) {
        const name = this.page.name
        return this.thingies.filter(obj => obj.location === name)
      }
      return []
    },
    thingieComponent () {
      return this.touchmode ? 'TouchThingie' : 'Thingie'
    },
    portals () {
      const portals = []
      if (this.page && this.showPortals) {
        const connections = this.page.portal_refs
        connections.forEach((connection) => {
          const vertices = connection.vertices
          if (vertices.a.location === this.pageName && connection.enabled) {
            portals.push({
              name: connection.edge,
              slug: vertices.b.location,
              at: vertices.a.at,
              colors: connection.thingie_ref ? connection.thingie_ref.colors : []
            })
          }
          if (vertices.b.location === this.pageName && connection.enabled) {
            portals.push({
              name: connection.edge,
              slug: vertices.a.location,
              at: vertices.b.at,
              colors: connection.thingie_ref ? connection.thingie_ref.colors : []
            })
          }
        })
      }
      const queue = []
      const slugs = portals.map(portal => portal.slug)
      const uniqueSlugs = [...new Set(slugs)]
      for (let i = 0; i < uniqueSlugs.length; i++) {
        const slug = uniqueSlugs[i]
        const found = portals.find(portal => portal.slug === slug)
        queue.push(found)
      }
      return queue
    },
    pageBounds () {
      return this.page && this.page.bounds ? this.page.bounds : { x: 2732, y: 2000 }
    },
    pageStyles () {
      return {
        '--page-var-field-width': `${this.pageBounds.x}px`,
        '--page-var-field-height': `${this.pageBounds.y}px`,
        '--page-background-image': `url(${this.backgroundImage})`
      }
    }
  },

  watch: {
    authenticated (val) {
      if (val && !this.pageExists) {
        this.openNewPageModal()
      }
    }
  },

  created () {
    this.$nuxt.$on('init-update-thingie-global', (update) => {
      this.initUpdate(update)
    })
  },

  async mounted () {
    await this.$connectWebsocket(this, () => {
      this.socket.emit('join-room', 'pages')
      this.socket.emit('join-room', 'cron|goa')
      this.socket.on('module|post-create-page|payload', (page) => {
        this.addPage(page)
      })
      const socketEvents = ['module|post-update-page|payload', 'module|page-state-update|payload']
      socketEvents.forEach((message) => {
        this.socket.on(message, (page) => {
          this.updatePage(page)
        })
      })
    })
    if (!this.page) {
      this.pageExists = false
    } else {
      this.$nextTick(() => { initPageScrollPosition(this) })
      this.keydown = (e) => { handleKeyCommand(e, this) }
      window.addEventListener('keydown', this.keydown)
    }
    const authToken = localStorage.getItem('fuitesAnarchiveAuthToken')
    const authDate = localStorage.getItem('fuitesAnarchiveAuthDate')
    if (process.client && authToken && authDate) {
      if (Date.now() - parseInt(authDate) <= 10800000) {
        this.authenticate(authToken)
      }
    }
  },

  beforeDestroy () {
    if (this.keydown) { window.removeEventListener('keydown', this.keydown )}
    this.$nuxt.$off('init-update-thingie-global')
  },

  methods: {
    ...mapActions({
      updateThingie: 'collections/updateThingie',
      clearPages: 'collections/clearPages',
      clearThingies: 'collections/clearThingies',
      postCreatePage: 'collections/postCreatePage',
      postUpdatePage: 'collections/postUpdatePage',
      addPage: 'collections/addPage',
      updatePage: 'collections/updatePage',
      setModal: 'general/setModal',
      authenticate: 'general/authenticate'
    }),
    openNewPageModal () {
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
      if (this.authenticated && this.page) {
        evt.preventDefault()
        const rect = evt.target.getBoundingClientRect()
        const x = evt.clientX - rect.left
        const y = evt.clientY - rect.top
        const thingieId = evt.dataTransfer.getData('_id')
        this.socket.emit('update-thingie', {
          _id: thingieId,
          location: this.pageName,
          last_update_token: this.pocket.token,
          dragging: false,
          at: { x, y, z: 1 },
          record_new_location: true
        })
        if (this.page.state === 'metastable') {
          this.createNewPageFromThingie(thingieId)
        }
      }
    },
    toggleEditor () {
      const propboard = this.$refs.propboard
      if (propboard && propboard.open) {
        propboard.closeEditor()
      } else {
        propboard.openEditor()
      }
    },
    openEditor (evt) {
      if (this.authenticated && this.page) {
        this.editorCoords = {
          x: evt.clientX + window.scrollX,
          y: evt.clientY + window.scrollY
        }
        if (this.$refs.propboard) {
          this.$refs.propboard.openEditor()
        }
      }
    },
    closeEditor (evt) {
      if (this.authenticated && this.page) {
        if (this.breakout) { this.breakout = false }
        if (!evt.altKey && this.$refs.propboard) {
          this.$refs.propboard.closeEditor()
        }
      }
    },
    async createNewPageFromThingie (thingieId) {
      const complete = await this.postCreatePage({
        creator_thingie: thingieId,
        overflow_page: this.pageName
      })
      if (complete) {
        const created = this.pages.find(item => item.name === complete.name)
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
    },
    generateScreenShot () {
      if (window && this.$refs.page) {
        Html2Canvas(this.$refs.page).then((canvas) => {
          const dataURL = canvas.toDataURL()
          this.backgroundImage = dataURL
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.page {
  --page-var-field-width: 2732px;
  --page-var-field-height: 2000px;
  --page-background-image: none;
  position: absolute;
  width: var(--page-var-field-width);
  height: var(--page-var-field-height);
  overflow: hidden;
  z-index: 1;
  &.non-existent {
    width: 100vw !important;
    height: 100vh !important;
  }
  &:before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background-size: 100%;
    background-repeat: no-repeat;
    background-image: var(--page-background-image);
    z-index: -10000;
    opacity: 0.1;
  }
}

.toggle.prop-board-toggle {
  position: fixed;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0.5rem;
  height: 2rem;
  z-index: 10000;
  bottom: 2rem;
  left: 2.5rem;
  color: $lavender;
  @include fontWeight_Bold;
  @include linkHover($lavender);
}

.screencap {
  position: absolute;
  top: 200px;
  left: 200px;
}

</style>
