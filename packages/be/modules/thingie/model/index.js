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
    required: true
  },
  location: {
    type: String,
    required: true,
    enum: ['space', 'pocket', 'compost']
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
  }
}, {
  timestamps: true,
  minimize: false
})

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
module.exports = Mongoose.model('thingies', ThingieSchema)
