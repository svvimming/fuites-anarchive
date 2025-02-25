console.log('💿 [model] verse')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

// ////////////////////////////////////////////////////////////////////// Schema
// -----------------------------------------------------------------------------
const VerseSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  page_refs: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'pages',
        required: false
      }
    ],
    required: true,
    validate: arr => Array.isArray(arr) && arr.length > 0
  },
  settings: {
    tunneler: {
      portalChainLength: {
        type: Number,
        required: false,
        default: 3
      }
    },
    fuitesbot: {
      gracePeriodMs: {
        type: Number,
        required: false,
        default: 86400000 // one day in milliseconds
      }
    }
  }
}, {
  timestamps: true,
  minimize: false
})

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
module.exports = Mongoose.model('verses', VerseSchema)
