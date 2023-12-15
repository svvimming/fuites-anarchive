<template>
  <div class="sensor-editor">
    
    <div
      v-for="(sensor, i) in sensors"
      :key="sensor.name"
      class="sensor">

      <span class="name">{{ sensor.name }}</span>

      <div :class="['editor', { 'text-area': property[i] === 'css' }]">

        <div class="calibration">
          <span class="title">calibration</span>
          <div class="input">
            <label :for="`voltage-min-${sensor.name}`">input voltage min:</label>
            <input
              v-model="voltageMin[i]"
              type="number"
              :id="`voltage-min-${sensor.name}`"
              :name="`voltage-min-${sensor.name}`"
              @change="settingChanged" />
          </div>
          <div class="input">
            <label :for="`voltage-max-${sensor.name}`">input voltage max:</label>
            <input
              v-model="voltageMax[i]"
              type="number"
              :id="`voltage-max-${sensor.name}`"
              :name="`voltage-max-${sensor.name}`"
              @change="settingChanged" />
          </div>
          <div class="input">
            <label :for="`out-range-min-${sensor.name}`">output range min:</label>
            <input
              v-model="outRangeMin[i]"
              type="number"
              :id="`out-range-min-${sensor.name}`"
              :name="`out-range-min-${sensor.name}`"
              @change="settingChanged" />
          </div>
          <div class="input">
            <label :for="`out-range-max-${sensor.name}`">output range max:</label>
            <input
              v-model="outRangeMax[i]"
              type="number"
              :id="`out-range-max-${sensor.name}`"
              :name="`out-range-max-${sensor.name}`"
              @change="settingChanged" />
          </div>
        </div>

        <div class="property">
          <span class="title">to affect</span>
          <select v-model="property[i]" @change="settingChanged">
            <option
              v-for="option in properties"
              :key="`${sensor.name}-${option}`">
              {{ option }}
            </option>
          </select>

          <div v-if="property[i] === 'css'" class="input">
            <label :for="`custom-css-${sensor.name}`">add css below:</label>
            <textarea
              :id="`custom-css-${sensor.name}`"
              v-model="styles[i]"
              :name="`custom-css-${sensor.name}`"
              class="code-area courier"
              @change="settingChanged">
            </textarea>
          </div>

        </div>

      </div>
      
    </div>

    <div class="settings">
      <div class="input">
        <label for="page-name">page name:</label>
        <input
          v-model="page"
          type="text"
          id="page-name"
          name="page-name" />
      </div>
      <button
        :class="['save', { saved: !changes }]"
        @click="saveSensorSettings">
        save
      </button>
    </div>

  </div>
</template>

<script>
// ====================================================================== Import
import { mapGetters, mapActions } from 'vuex'
import EditableParams from '@/data/thingie-editable-params.json'

// ====================================================================== Export
export default {
  name: 'SensorsPopout',

  data () {
    return {
      voltageMin: [],
      voltageMax: [],
      outRangeMin: [],
      outRangeMax: [],
      property: [],
      styles: [],
      page: '',
      changes: false
    }
  },

  computed: {
    ...mapGetters({
      editorThingie: 'collections/editorThingie',
      sensors: 'sensor/sensors'
    }),
    sensorsEnabled () {
      return this.thingie.sensors ? this.thingie.sensors_active : []
    },
    properties () {
      return EditableParams.sensor_affectable_properties
    },
    dbVmins () {
      return this.sensors.map(sensor => sensor.inputVoltage.min)
    },
    dbVmaxs () {
      return this.sensors.map(sensor => sensor.inputVoltage.max)
    },
    dbRangeMin () {
      return this.sensors.map(sensor => sensor.outputRange.min)
    },
    dbRangeMax () {
      return this.sensors.map(sensor => sensor.outputRange.max)
    },
    dbProperty () {
      return this.sensors.map(sensor => sensor.affecting)
    },
    dbStyles () {
      return this.sensors.map(sensor => `${sensor.css?.join(';\n') + ';'}`)
    }
  },

  mounted () {
    this.page = this.sensors[0].page
    this.voltageMin = this.dbVmins
    this.voltageMax = this.dbVmaxs
    this.outRangeMin = this.dbRangeMin
    this.outRangeMax = this.dbRangeMax
    this.property = this.dbProperty
    this.styles = this.dbStyles
  },

  watch: {
    page () {
      this.settingChanged()
    }
  },

  methods: {
    ...mapActions({
      postUpdateSensorSettings: 'sensor/postUpdateSensorSettings'
    }),
    settingChanged () {
      if (!this.changes) {
        this.changes = true
      }
    },
    saveSensorSettings () {
      if (!this.page) {
        this.$toaster.addToast({
          type: 'toast',
          category: 'error',
          message: 'sensors are missing a page name!'
        })
        return
      }
      const fieldsValid = this.validateFields()
      if (fieldsValid) {
        const data = []
        const sensors = this.sensors
        for (let i = 0; i < sensors.length; i++) {
          let styles = this.styles[i]
          if (styles) {
            styles = styles.replace(/[{}]/g, '')
            styles = styles.replace(/(?:\r\n|\r|\n)/g, '')
            styles = styles.split(';').map(line => line.trim()).filter(line => line !== '')
          }
          data.push({
            name: sensors[i].name,
            page: this.page,
            inputVoltage: {
              min: parseFloat(this.voltageMin[i]),
              max: parseFloat(this.voltageMax[i])
            },
            outputRange: {
              min: parseFloat(this.outRangeMin[i]),
              max: parseFloat(this.outRangeMax[i])
            },
            affecting: this.property[i],
            css: styles
          })
        }
        this.postUpdateSensorSettings({ updates: data })
        this.changes = false
      } else {
        this.$toaster.addToast({
          type: 'toast',
          category: 'error',
          message: 'oops, there was a problem with one of the settings...'
        })
      }
    },
    validateFields () {
      return (
        this.voltageMin.every(item => !isNaN(parseFloat(item))) &&
        this.voltageMax.every(item => !isNaN(parseFloat(item))) &&
        this.outRangeMin.every(item => !isNaN(parseFloat(item))) &&
        this.outRangeMax.every(item => !isNaN(parseFloat(item)))
      )
    }
  }
}

</script>

<style lang="scss" scoped>
// ///////////////////////////////////////////////////////////////////// General
.sensor-editor {
  overflow: scroll;
  max-height: 50rem;
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

input {
  width: 3rem;
  border: solid 0.5px $lavender;
  font-size: 14px;
  padding: 2px 4px;
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
  height: 5rem;
  @include fontSize_Main;
  padding-bottom: 1.5rem;
  margin-bottom: 0.25rem;
}

.settings {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-left: 1.5rem;
  margin-right: 1rem;
  input {
    width: 7rem;
    font-size: 11px;
    padding: 4px;
  }
}

.save {
  display: block;
  padding: 2px 19px;
  background-color: #3d3942;
  color: white;
  border: solid 0.5px rgba(#3d3942, 0);
  border-radius: 1rem;
  &:not(.saved) {
    @include fontWeight_Bold;
    @include linkHover(#3d3942);
  }
  &.saved,
  &:active {
    cursor: default;
    color: #3d3942;
    background-color: white;
    border: solid 0.5px rgba(#3d3942, 1);
  }
}
</style>