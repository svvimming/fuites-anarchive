<template>
  <div class="sensor-editor">
    
    <div
      v-for="(sensor, i) in sensorsAvailable"
      :key="sensor"
      class="sensor">

      <span class="name">{{ sensor }}</span>

      <div :class="['editor', { 'text-area': property[i] === 'css' }]">

        <div class="calibration">
          <span class="title">calibration</span>
          <div class="input">
            <label :for="`voltage-min-${sensor}`">input voltage min:</label>
            <input v-model="voltageMin[i]" type="number" :id="`voltage-min-${sensor}`" :name="`voltage-min-${sensor}`" />
          </div>
          <div class="input">
            <label :for="`voltage-max-${sensor}`">input voltage max:</label>
            <input v-model="voltageMax[i]" type="number" :id="`voltage-max-${sensor}`" :name="`voltage-max-${sensor}`" />
          </div>
          <div class="input">
            <label :for="`out-range-min-${sensor}`">output range min:</label>
            <input v-model="outRangeMin[i]" type="number" :id="`out-range-min-${sensor}`" :name="`out-range-min-${sensor}`" />
          </div>
          <div class="input">
            <label :for="`out-range-max-${sensor}`">output range max:</label>
            <input v-model="outRangeMax[i]" type="number" :id="`out-range-max-${sensor}`" :name="`out-range-max-${sensor}`" />
          </div>
        </div>

        <div class="property">
          <span class="title">to affect</span>
          <select v-model="property[i]">
            <option
              v-for="option in properties"
              :key="`${sensor}-${option}`">
              {{ option }}
            </option>
          </select>

          <div v-if="property[i] === 'css'" class="input">
            <label :for="`custom-css-${sensor}`">add css below:</label>
            <textarea
              :id="`custom-css-${sensor}`"
              v-model="styles[i]"
              :name="`custom-css-${sensor}`"
              class="code-area courier">
            </textarea>
          </div>

        </div>

      </div>
      
    </div>

  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import EditableParams from '@/data/thingie-editable-params.json'

export default {
  name: 'SensorsPopout',

  data () {
    return {
      voltageMin: [0, 0, 0],
      voltageMax: [0, 0, 0],
      outRangeMin: [0, 0, 0],
      outRangeMax: [0, 0, 0],
      property: [null, null, null],
      styles: [null, null, null]
    }
  },

  computed: {
    ...mapGetters({
      editorThingie: 'collections/editorThingie'
    }),
    sensorsEnabled () {
      return this.thingie.sensors ? this.thingie.sensors_active : []
    },
    sensorsAvailable () {
      return EditableParams.sensors_available
    },
    properties () {
      return EditableParams.sensor_affectable_properties
    }
  }
}

</script>

<style lang="scss" scoped>
.sensor-editor {
  overflow: scroll;
}

.editor {
  position: relative;
  display: flex;
  margin: 0 1rem 1.25rem 1.5rem;
  padding: 0.75rem 1rem;
  padding-left: 1.25rem;
  max-height: 156px;
  transition: max-height 200ms ease;
  &.text-area {
    max-height: 240px;
  }
  &:before {
    content: '';
    position: absolute;
    top: -2rem;
    left: 0;
    width: 100%;
    height: calc(100% + 2rem);
    background-color: $lavender;
    opacity: 0.25;
    z-index: 1;
    border-radius: 1rem;
  }
  &:after {
    content: '';
    position: absolute;
    top: -1px;
    left: 0;
    width: 100%;
    height: 0;
    border-bottom: solid 1px white;
    z-index: 1;
  }
}

.name {
  display: inline-block;
  font-weight: 600;
  width: 100%;
  border-bottom: solid 0.5px $lavender;
}

.title {
  display: block;
}

label {
  width: 7.5rem;
  font-size: 13px;
  color: #3d3942;
  opacity: 0.9;
}

.calibration,
.property {
  position: relative;
  z-index: 2;
}

.calibration {
  padding-right: 1.5rem;
  .input {
    padding-left: 1.5rem;
    display: flex;
    margin-bottom: 0.25rem;
  }
  input {
    width: 3rem;
    border: solid 0.5px $lavender;
    font-size: 14px;
    padding: 2px 4px;
  }
}

.property {
  flex-grow: 1;
}

.code-area {
  display: block;
  background: #3d3942;
  color: #d1d0db;
  border-radius: 0.125rem;
  padding: 0.25rem;
  width: 100%;
  height: 8rem;
  @include fontSize_Main;
  padding-bottom: 1.5rem;
  margin-bottom: 0.25rem;
}
</style>