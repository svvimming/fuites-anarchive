console.log('💿 [model] print')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

// ////////////////////////////////////////////////////////////////////// Schema
// -----------------------------------------------------------------------------
const PrintSchema = new Schema({
  page: {
    type: String,
    required: true
  },
  data_url: {
    type: String,
    required: true
  }
})

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
module.exports = Mongoose.model('prints', PrintSchema)
