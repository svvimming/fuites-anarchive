<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'

// ====================================================================== Export
export default {
  name: 'Thingie',

  props: {
    consistency: {
      type: String,
      required: true,
      default: ''
    },
    location: {
      type: String,
      required: true,
      default: ''
    }
  },

  data () {
    return {
      mouseX: false,
      mouseY: false,
      clientX: 0,
      clientY: 0,
      deltaX: 0,
      deltaY: 0
    }
  },

  computed: {
    ...mapGetters({
      pocketThingies: 'collections/pocketThingies',
      spazeThingies: 'collections/spazeThingies'
    }),
    thingie () {
      if (this.location) {
        const getter = `${this.location}Thingies`
        const collection = this[getter]
        return collection.find(thingie => thingie.consistency === this.consistency)
      }
      return false
    },
    position () {
      if (this.thingie) { return this.thingie.at }
      return { x: 0, y: 0, z: 0 }
    },
    styles () {
      if (this.thingie) {
        return {
          left: this.position.x - this.deltaX + 'px',
          top: this.position.y - this.deltaY + 'px',
          zIndex: this.position.z + 'px'
        }
      }
      return undefined
    }
  },

  methods: {
    ...mapActions({
      updateThingie: 'collections/updateThingie'
    }),
    mousedown (evt) {
      if (!evt.shiftKey) {
        evt.preventDefault()
        // get the mouse cursor position at startup:
        this.mouseX = evt.clientX
        this.mouseY = evt.clientY
        this.clientX = evt.clientX
        this.clientY = evt.clientY
        document.onmousemove = this.drag
        document.onmouseup = this.mouseup
      }
    },
    drag (evt) {
      evt.preventDefault()
      this.deltaX = this.deltaX + this.clientX - event.clientX
      this.deltaY = this.deltaY + this.clientY - event.clientY
      this.clientX = event.clientX
      this.clientY = event.clientY
    },
    mouseup (evt) {
      evt.preventDefault()
      const deltaX = evt.clientX - this.mouseX
      const deltaY = evt.clientY - this.mouseY
      document.onmousemove = null
      document.onmouseup = null
      this.clientX = 0
      this.clientY = 0
      this.deltaX = 0
      this.deltaY = 0
      this.updateThingie({
        consistency: this.consistency,
        current_location: this.location,
        data: [
          {
            key: 'at',
            value: {
              x: this.position.x + deltaX,
              y: this.position.y + deltaY,
              z: this.position.z
            }
          }
        ]
      })
    },
    startDrag (evt) {
      evt.dataTransfer.dropEffect = 'move'
      evt.dataTransfer.effectAllowed = 'move'
      evt.dataTransfer.setData('consistency', this.consistency)
      evt.dataTransfer.setData('location', this.location)
    }
  },

  render () {
    return this.$scopedSlots.default({
      mousedown: this.mousedown,
      startDrag: this.startDrag,
      styles: this.styles
    })
  }
}
</script>
