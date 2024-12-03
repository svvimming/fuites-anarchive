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
}, {
  _id: false
})

// --------------------------------------------------------------------- Thingie
const ThingieSchema = new Schema({
  file_ref: {
    type: Schema.Types.ObjectId,
    ref: 'uploads',
    required: false
  },
  pocket_ref: {
    type: Schema.Types.ObjectId,
    ref: 'pockets',
    required: false
  },
  verse: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: false
  },
  location_history: {
    type: [VertexSchema],
    required: false,
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
    width: {
      type: Number,
      required: true
    },
    height: {
      type: Number,
      required: true
    },
    rotation: {
      type: Number,
      required: true
    }
  },
  zIndex: {
    type: Number,
    required: false,
    default: 1
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
    required: false,
    default: ''
  },
  creator_token: {
    type: String,
    required: true
  },
  last_update: {
    token: {
      type: String,
      required: false
    },
    timestamp: {
      type: String,
      required: false
    }
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
module.exports = Mongoose.model('thingies', ThingieSchema)
