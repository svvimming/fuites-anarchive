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
  connections: {
    type: [String]
  },
  session_token: {
    type: String,
    required: true
  },
  creator_thingie: {
    type: Schema.Types.ObjectId,
    ref: 'thingies',
    required: false
  },
  state: {
    type: String,
    required: false,
    default: 'clumping',
    enum: ['clumping', 'metastable', 'leaking']
  }
}, {
  timestamps: true,
  minimize: false
})

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
module.exports = Mongoose.model('spazes', SpazeSchema)
