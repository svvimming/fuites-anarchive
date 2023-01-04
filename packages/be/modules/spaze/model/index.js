console.log('💿 [model] spaze')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

// ////////////////////////////////////////////////////////////////////// Schema
// -----------------------------------------------------------------------------
const SpazeSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  portal_refs: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'portals',
        required: false
      }
    ],
    required: false
  },
  initiator_token: {
    type: String,
    required: true
  },
  creator_thingie: {
    type: Schema.Types.ObjectId,
    ref: 'thingies',
    required: false
  },
  overflow_spaze: {
    type: String,
    required: false
  },
  state: {
    type: String,
    required: false,
    default: 'clumping',
    enum: ['clumping', 'metastable', 'leaking']
  },
  bounds: {
    x: {
      type: Number,
      required: false,
      default: 2732
    },
    y: {
      type: Number,
      required: false,
      default: 2000
    }
  },
  consistencies: {
    type: [String],
    required: false,
    default: []
  }
}, {
  timestamps: true,
  minimize: false
})

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
module.exports = Mongoose.model('spazes', SpazeSchema)
