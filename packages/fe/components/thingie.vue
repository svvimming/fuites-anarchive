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
      handleX: false,
      handleY: false
    }
  },

  computed: {
    position () {
      return this.thingie.at
    },
    scale () {
      return this.thingie.width ? this.thingie.width : 80
    },
    rotate () {
      return this.thingie.angle
    },
    styles () {
      return {
        left: this.position.x + 'px',
        top: this.position.y + 'px',
        zIndex: this.position.z + 'px',
        width: this.scale + 'px',
        transform: `rotate(${this.rotate}deg)`
      }
    }
  },

  methods: {
    ...mapActions({
      updateThingie: 'collections/updateThingie'
    }),
    mousedown (evt) {
      // console.log('mousedown')
      if (!evt.shiftKey && !this.thingie.dragging) {
        evt.preventDefault()
        const thingie = this.$el
        const thingieRect = thingie.getBoundingClientRect()
        this.handleX = evt.clientX - thingieRect.left
        this.handleY = evt.clientY - thingieRect.top
        document.onmousemove = this.$throttle((e) => { this.drag(e) })
        document.onmouseup = this.mouseup
      }
    },
    drag (evt) {
      // console.log('drag')
      evt.preventDefault()
      const parent = this.$parent.$el
      const rect = parent.getBoundingClientRect()
      let x = Math.max(0, evt.clientX - rect.left - this.handleX)
      let y = Math.max(0, evt.clientY - rect.top - this.handleY)
      if (this.thingie.location === 'pocket') {
        const thingie = this.$el
        const thingieRect = thingie.getBoundingClientRect()
        x = Math.min(640 - thingieRect.width, x)
        y = Math.min(400 - thingieRect.height, y)
      }
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
      // console.log('mouseup')
      evt.preventDefault()
      this.handleX = false
      this.handleY = false
      document.onmousemove = null
      document.onmouseup = null
    },
    startDrag (evt) {
      // console.log('startDrag')
      evt.dataTransfer.dropEffect = 'move'
      evt.dataTransfer.effectAllowed = 'move'
      evt.dataTransfer.setData('_id', this.thingie._id)
    }
    // wheel (evt) {
    //   evt.preventDefault();
    //   if (evt.ctrlKey && this.scale) {
    //     const coef = this.scale - evt.deltaY * 0.01
    //     this.$emit('wheel', {
    //       _id: this.thingie._id,
    //       scale: coef
    //     })
    //   }
    // }
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
