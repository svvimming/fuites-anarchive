console.log('💿 [model] sensor')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

// ////////////////////////////////////////////////////////////////////// Schema
// -----------------------------------------------------------------------------
const SensorSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  page: {
    type: String,
    required: true
  },
  inputVoltage: {
    min: {
      type: Number,
      required: true,
      default: 0
    },
    max: {
      type: Number,
      required: true,
      default: 1
    }
  },
  outputRange: {
    min: {
      type: Number,
      required: true,
      default: 0
    },
    max: {
      type: Number,
      required: true,
      default: 1
    }
  },
  affecting: {
    type: String,
    required: true,
    default: ''
  },
  css: {
    type: [String],
    required: false
  }
}, {
  timestamps: true,
  minimize: false
})

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
module.exports = SensorSchema
