<template>
  <section
    ref="page"
    class="page-container"
    :style="pageDimensions">

    <div
      id="page-background-image"
      class="page-background"
      :style="pageBackground">
    </div>

    <div
      :id="`page-${pageName}`"
      :class="['page', {'non-existent': !pageExists }]"
      @drop="onDrop($event)"
      @dragover.prevent
      @dragenter.prevent
      @click.alt.self="openEditor($event)"
      @click.self="closeEditor($event)">

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

    </div>
  </section>
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
const initPageScrollPosition = (instance, next) => {
  if (instance.$refs.page) {
    const bounds = instance.pageBounds
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
    const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    const x = Math.round((bounds.x - vw) / 2)
    const y = Math.round((bounds.y - vh) / 2)
    window.scrollTo(x, y)
    instance.offset = { x, y }
    // callback function
    return next()
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

const handlePageBackgroundUpdate = async (instance) => {
  const page = instance.page
  await instance.getPageBackground({ print_id: page.print_ref })
  if (page.init_screencap) {
    instance.generateScreenShot()
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
      breakout: false
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
      background: 'collections/background',
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
    pageDimensions () {
      return {
        '--page-var-field-width': `${this.pageBounds.x}px`,
        '--page-var-field-height': `${this.pageBounds.y}px`
      }
    },
    pageBackground () {
      return this.page && this.page.print_ref && this.background ? 
        { 'background-image': `url(${this.background})` } : 
        { 'background-image': 'none' }
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
    // init socket connections
    await this.$connectWebsocket(this, () => {
      this.socket.emit('join-room', `${this.$config.mongoInstance}|pages`)
      this.socket.emit('join-room', `${this.$config.mongoInstance}|goa`)
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
    // Check if page exists
    if (!this.page) {
      this.pageExists = false
    } else {
      this.keydown = (e) => { handleKeyCommand(e, this) }
      window.addEventListener('keydown', this.keydown)
      // Scroll view to the center of the page.
      // When finished callback sets page loaded state to true
      this.$nextTick(() => { 
        initPageScrollPosition(this, () => {
          handlePageBackgroundUpdate(this)
        })
      })
    }
    // Retrieve token from local storage and if it exists automate login
    if (!this.authenticated) {
      const authToken = localStorage.getItem('fuitesAnarchiveAuthToken')
      const authDate = localStorage.getItem('fuitesAnarchiveAuthDate')
      if (process.client && authToken && authDate) {
        if (Date.now() - parseInt(authDate) <= 10800000) {
          this.authenticate(authToken)
        }
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
      postUpdatePageBackground: 'collections/postUpdatePageBackground',
      getPageBackground: 'collections/getPageBackground',
      setPageBackground: 'collections/setPageBackground',
      setModal: 'general/setModal',
      authenticate: 'general/authenticate'
    }),
    openNewPageModal () {
      this.setModal(true)
    },
    initMousedown (thingie) {
      this.socket.emit(`${this.$config.mongoInstance}|update-thingie`, {
        _id: thingie._id,
        dragging: true,
        last_update_token: this.pocket.token
      })
    },
    initMouseup (thingie) {
      this.socket.emit(`${this.$config.mongoInstance}|update-thingie`, {
        _id: thingie._id,
        dragging: false,
        last_update_token: this.pocket.token
      })
    },
    initUpdate (thingie) {
      thingie.last_update_token = this.pocket.token
      this.socket.emit(`${this.$config.mongoInstance}|update-thingie`, thingie)
      this.saveLastUpdate(thingie)
    },
    onDrop (evt) {
      if (this.authenticated && this.page) {
        evt.preventDefault()
        const rect = evt.target.getBoundingClientRect()
        const x = evt.clientX - rect.left
        const y = evt.clientY - rect.top
        const thingieId = evt.dataTransfer.getData('_id')
        this.socket.emit(`${this.$config.mongoInstance}|update-thingie`, {
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
          this.socket.emit(`${this.$config.mongoInstance}|update-thingie`, {
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
      if (document && window && this.$refs.page && !this.touchmode) {
        const bg = document.getElementById('page-background-image')
        const page = document.getElementById(`page-${this.pageName}`)
        if (bg) { bg.style.opacity = 1.0 }
        if (page) { page.style.opacity = 0.5 }
        const newCanvas = document.createElement('canvas')
        newCanvas.style.width = `${this.pageBounds.x * 0.1}px`
        newCanvas.style.height = `${this.pageBounds.y * 0.1}px`
        newCanvas.width = this.pageBounds.x * 0.1
        newCanvas.height = this.pageBounds.y * 0.1
        const ctx = newCanvas.getContext('2d')
        Html2Canvas(this.$refs.page, {
          backgroundColor: null,
          canvas: newCanvas,
          scale: 0.1,
          width: this.pageBounds.x * 0.1,
          height: this.pageBounds.y * 0.1 
        }).then(async (canvas) => {
          const context = canvas.getContext('2d')
          const dataURL = canvas.toDataURL('image/png', 1.0)
          await this.postUpdatePageBackground({
            page_name: this.pageName,
            data_url: dataURL,
            print_id: this.page.print_ref
          })
          if (bg) { bg.style.opacity = 0.25 }
          if (page) { page.style.opacity = 1.0 }
        }).catch((e) => {
          console.log('====================== [_id method: generateScreenShot]')
          console.log(e)
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.page-container {
  --page-var-field-width: 2732px;
  --page-var-field-height: 2000px;
  .page,
  .page-background {
    width: var(--page-var-field-width);
    height: var(--page-var-field-height);
  }
}

.page {
  position: absolute;
  overflow: hidden;
  z-index: 1;
  &.non-existent {
    width: 100vw !important;
    height: 100vh !important;
  }
}

.page-background {
  position: absolute;
  top: 0;
  left: 0;
  background-size: 100%;
  background-repeat: no-repeat;
  z-index: 0;
  opacity: 0.25;
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

</style>
