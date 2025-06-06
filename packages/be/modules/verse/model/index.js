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
      overflowIntensity: {
        type: Number,
        required: false,
        default: 1
      }
    },
    compost: {
      gracePeriod: {
        type: Number,
        required: false,
        default: 30 // 30 days
      }
    }
  },
  average_colors: {
    primary: {
      type: String,
      required: false
    },
    secondary: {
      type: String,
      required: false
    }
  },
  public: {
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
module.exports = Mongoose.model('verses', VerseSchema)
