console.log('💿 [model] portal')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

// ////////////////////////////////////////////////////////////////////// Schema
// -----------------------------------------------------------------------------
const PortalSchema = new Schema({
  file_ref: {
    type: Schema.Types.ObjectId,
    ref: 'thingies',
    required: false
  },
  edge: {
    type: String,
    required: true
  },
  vertices: {
    type: [
      {
        name: {
          type: String,
          required: true
        },
        at: {
          x: {
            type: Number,
            required: true
          },
          y: {
            type: Number,
            required: true
          }
        }
      }
    ],
    required: true,
    validate: [(val) => { return val.length === 2 }, 'portal must have two vertices']
  }
}, {
  timestamps: true,
  minimize: false
})

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
module.exports = Mongoose.model('portals', PortalSchema)
