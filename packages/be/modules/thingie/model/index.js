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
  /** Identifiers */
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
  thingie_type: {
    type: String,
    required: true,
    enum: ['image', 'text', 'sound', 'video']
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
  /** Shared properties */
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
  opacity: {
    type: Number,
    required: false,
    default: 1.0
  },
  dragging: {
    type: Boolean,
    required: true,
    default: false
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
  consistencies: {
    type: [String],
    required: false
  },
  colors: {
    type: [String],
    required: false
  },
  compostedAt: {
    type: Date,
    required: false
  },
  css: {
    type: [String],
    required: false
  },
  /** Image specific */
  clip: {
    type: Boolean,
    required: false,
    default: false
  },
  /** Sound specific */
  gain: {
    type: Number,
    required: false,
    default: 1
  },
  stroke_width: {
    type: Number,
    required: false,
    default: 3
  },
  /** Image and Sound */
  path_data: {
    type: String,
    required: false
  },
  /** Text specific */
  text: {
    type: String,
    required: false,
    default: ''
  },
  locked: {
    type: Boolean,
    required: false,
    default: false
  }
}, {
  timestamps: true,
  minimize: false
})

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
module.exports = Mongoose.model('thingies', ThingieSchema)
