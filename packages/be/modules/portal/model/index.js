console.log('💿 [model] portal')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

// ///////////////////////////////////////////////////////////////////// Schemas
// ---------------------------------------------------------------------- Vertex
const VertexSchema = new Schema({
  location: {
    type: String,
    required: true
  },
  page_ref: {
    type: Schema.Types.ObjectId,
    ref: 'pages',
    required: false
  },
  at: {
    x: {
      type: Number,
      required: false
    },
    y: {
      type: Number,
      required: false
    }
  }
}, {
  _id: false
})

// ---------------------------------------------------------------------- Portal
const PortalSchema = new Schema({
  thingie_ref: {
    type: Schema.Types.ObjectId,
    ref: 'thingies',
    required: false
  },
  verse_ref: {
    type: Schema.Types.ObjectId,
    ref: 'verses',
    required: false
  },
  verse: {
    type: String,
    required: true
  },
  vertices: {
    type: [VertexSchema],
    required: true,
    validate: [(val) => { return val.length === 2 }, 'Portal does not have the correct number of vertices (2).']
  },
  manual: {
    type: Boolean,
    required: false
  }
}, {
  timestamps: true,
  minimize: false
})

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
module.exports = Mongoose.model('portals', PortalSchema)
