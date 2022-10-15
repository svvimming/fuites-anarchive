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

  computed: {
    position () {
      return this.thingie.at
    },
    styles () {
      return {
        left: this.position.x + 'px',
        top: this.position.y + 'px',
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
        document.onmousemove = this.$throttle((e) => { this.drag(e) })
        document.onmouseup = this.mouseup
      }
    },
    drag (evt) {
      console.log('drag')
      evt.preventDefault()
      const parent = this.$parent.$el
      const rect = parent.getBoundingClientRect()
      const x = evt.clientX - rect.left
      const y = evt.clientY - rect.top
      this.$emit('drag', {
        _id: this.thingie._id,
        at: {
          x: x,
          y: y,
          z: this.position.z
        }
      })
    },
    mouseup (evt) {
      console.log('mouseup')
      evt.preventDefault()
      document.onmousemove = null
      document.onmouseup = null
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
