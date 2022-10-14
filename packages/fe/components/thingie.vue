<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'

// ====================================================================== Export
export default {
  name: 'Thingie',

  props: {
    thingie: {
      type: Object,
      required: true
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
    position () {
      return this.thingie.at
    },
    styles () {
      return {
        left: this.position.x - this.deltaX + 'px',
        top: this.position.y - this.deltaY + 'px',
        zIndex: this.position.z + 'px'
      }
    }
  },

  methods: {
    ...mapActions({
      updateThingie: 'collections/updateThingie'
    }),
    mousedown (evt) {
      console.log('mousedown')
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
      console.log('drag')
      evt.preventDefault()
      this.deltaX = this.deltaX + this.clientX - event.clientX
      this.deltaY = this.deltaY + this.clientY - event.clientY
      this.clientX = event.clientX
      this.clientY = event.clientY
      const deltaX = evt.clientX - this.mouseX
      const deltaY = evt.clientY - this.mouseY
      this.$emit('drag', {
        _id: this.thingie._id,
        at: {
          x: deltaX,
          y: deltaY,
          z: this.position.z
        }
      })
    },
    mouseup (evt) {
      console.log('mouseup')
      evt.preventDefault()
      const deltaX = evt.clientX - this.mouseX
      const deltaY = evt.clientY - this.mouseY
      document.onmousemove = null
      document.onmouseup = null
      this.clientX = 0
      this.clientY = 0
      this.deltaX = 0
      this.deltaY = 0
      // this.updateThingie({
      //   // current_location: this.location,
      //   data: [
      //     {
      //       key: 'at',
      //       value: {
      //         x: this.position.x + deltaX,
      //         y: this.position.y + deltaY,
      //         z: this.position.z
      //       }
      //     }
      //   ]
      // })
    },
    startDrag (evt) {
      console.log('startDrag')
      evt.dataTransfer.dropEffect = 'move'
      evt.dataTransfer.effectAllowed = 'move'
      evt.dataTransfer.setData('_id', this.thingie._id)
    }
  },

  render () {
    return this.$scopedSlots.default({
      mousedown: this.mousedown,
      mouseup: this.mouseup,
      startDrag: this.startDrag,
      styles: this.styles
    })
  }
}
</script>
