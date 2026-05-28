console.log('💿 [model] verse')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

// ////////////////////////////////////////////////////////////////////// Schema
// -----------------------------------------------------------------------------
// ---------------------------------------------------------------- Verse FontRef
const VerseFontSchema = new Schema({
  class: {
    type: String,
    required: true
  },
  display: {
    type: String,
    required: true
  },
  styleAttribute: {
    type: String,
    required: true
  },
  fontFaceDeclaration: {
    type: String,
    required: true
  },
  default: {
    type: Boolean,
    required: false
  }
}, {
  _id: false
})

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
  initiator_pocket_ref: {
    type: Schema.Types.ObjectId,
    ref: 'pockets',
    required: false
  },
  settings: {
    /**
     * Optional list of font selections for this verse.
     * Single allowed type: Array of COMPLETE font objects as found in
     * `packages/fe/data/settings.json` -> fonts[]:
     *   { class, display, styleAttribute, fontFaceDeclaration, default? }
     * - `class` must match the defaults list.
     * - If omitted or empty, frontend falls back to global defaults.
     */
    fonts: {
      type: [VerseFontSchema],
      required: false,
      default: undefined
    },
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
    },
    private: {
      type: Boolean,
      required: false,
      default: false
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
  }
}, {
  timestamps: true,
  minimize: false
})

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
module.exports = Mongoose.model('verses', VerseSchema)
