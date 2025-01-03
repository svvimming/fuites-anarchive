console.log('💿 [model] print')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

// ////////////////////////////////////////////////////////////////////// Schema
// -----------------------------------------------------------------------------
const PrintSchema = new Schema({
  page_ref: {
    type: Schema.Types.ObjectId,
    ref: 'pages',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  filesize: {
    type: Number,
    required: true
  },
  file_ext: {
    type: String,
    required: true
  },
  upload_status: { // 0 = in progress, 1 = complete, 2 = error
    type: Number,
    required: true,
    enum: [0, 1, 2],
    default: 0
  }
}, {
  timestamps: true,
  minimize: false
})

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
module.exports = Mongoose.model('prints', PrintSchema)
