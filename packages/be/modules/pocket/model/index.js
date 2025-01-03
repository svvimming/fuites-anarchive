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
  verses: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'verses',
        required: false
      }
    ],
    required: true
  }
}, {
  timestamps: true,
  minimize: false
})

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
module.exports = Mongoose.model('pockets', PocketSchema)
