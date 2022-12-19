console.log('💿 [model] pocket')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

// ////////////////////////////////////////////////////////////////////// Schema
// -----------------------------------------------------------------------------
const PocketSchema = new Schema({
  token: {
    type: String,
    required: true
  },
  thingies: {
    type: [String],
    required: true,
    default: []
  }
}, {
  timestamps: true,
  minimize: false
})

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
module.exports = Mongoose.model('pockets', PocketSchema)
