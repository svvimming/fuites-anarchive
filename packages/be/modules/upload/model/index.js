console.log('💿 [model] upload')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

// ////////////////////////////////////////////////////////////////////// Schema
// -----------------------------------------------------------------------------
const UploadSchema = new Schema({
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
  file_url: {
    type: String,
    required: false
  },
  upload_status: { // 0 = in progress, 1 = complete, 2 = error
    type: Number,
    required: true,
    enum: [0, 1, 2],
    default: 0
  },
  palette: {
    type: [[]],
    required: false
  },
  aspect: {
    type: Number,
    required: false,
    default: 1
  }
}, {
  timestamps: true,
  minimize: false
})

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
module.exports = Mongoose.model('uploads', UploadSchema)
