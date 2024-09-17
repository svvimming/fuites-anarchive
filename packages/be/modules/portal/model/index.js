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
})

// ---------------------------------------------------------------------- Portal
const PortalSchema = new Schema({
  thingie_ref: {
    type: Schema.Types.ObjectId,
    ref: 'thingies',
    required: false
  },
  verse: {
    type: String,
    required: true
  },
  edge: {
    type: String,
    required: true
  },
  vertices: {
    a: {
      type: VertexSchema
    },
    b: {
      type: VertexSchema
    }
  },
  enabled: {
    type: Boolean,
    required: false
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
