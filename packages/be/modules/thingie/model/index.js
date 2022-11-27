console.log('💿 [model] thingie')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

// ////////////////////////////////////////////////////////////////////// Schema
// -----------------------------------------------------------------------------
const ThingieSchema = new Schema({
  file_ref: {
    type: Schema.Types.ObjectId,
    ref: 'uploads',
    required: false
  },
  location: {
    type: String,
    required: true,
    enum: ['spaze', 'pocket', 'compost']
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
  }
}, {
  timestamps: true,
  minimize: false
})

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
module.exports = Mongoose.model('thingies', ThingieSchema)
