console.log('💿 [model] thingie')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

// ////////////////////////////////////////////////////////////////////// Schema
// ---------------------------------------------------------------------- Vertex
const VertexSchema = new Schema({
  location: {
    type: String,
    required: true
  },
  at: {
    x: {
      type: Number,
      required: false
    },
    y: {
      type: Number,
      required: false
    }
  }
})

// --------------------------------------------------------------------- Thingie
const ThingieSchema = new Schema({
  file_ref: {
    type: Schema.Types.ObjectId,
    ref: 'Upload',
    required: false
  },
  location: {
    type: String,
    required: true
  },
  last_locations: {
    type: [VertexSchema],
    required: false,
    validate: [(val) => { return val.length < 6 }, 'recorded locations should not exceed 5'],
    default: []
  },
  dragging: {
    type: Boolean,
    required: true,
    default: false
  },
  at: {
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    },
    z: {
      type: Number,
      required: true
    }
  },
  width: {
    type: Number,
    required: true
  },
  angle: {
    type: Number,
    required: true
  },
  gain: {
    type: Number,
    required: false,
    default: 1
  },
  thingie_type: {
    type: String,
    required: true,
    enum: ['image', 'text', 'sound', 'video']
  },
  text: {
    type: String,
    required: false
  },
  fontsize: {
    type: Number,
    required: false
  },
  fontfamily: {
    type: String,
    required: false
  },
  creator_token: {
    type: String,
    required: true
  },
  last_update_token: {
    type: String,
    required: true
  },
  last_update: {
    type: Date,
    required: false
  },
  consistencies: {
    type: [String],
    required: false
  },
  colors: {
    type: [String],
    required: false
  },
  opacity: {
    type: Number,
    required: false,
    default: 1.0
  },
  clip: {
    type: Boolean,
    required: false,
    default: false
  },
  path_data: {
    type: String,
    required: false
  },
  stroke_width: {
    type: Number,
    required: false,
    default: 3
  },
  update_count: {
    type: Number,
    required: false,
    default: 0
  },
  preacceleration: {
    type: Number,
    required: false,
    default: 0
  },
  compostedAt: {
    type: Date,
    required: false
  },
  css: {
    type: [String],
    required: false
  },
  sensors: {
    type: Number,
    required: false
  },
  sensors_active: {
    type: [String],
    required: false
  }
}, {
  timestamps: true,
  minimize: false
})

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
module.exports = ThingieSchema // Mongoose.model('thingies', ThingieSchema)
