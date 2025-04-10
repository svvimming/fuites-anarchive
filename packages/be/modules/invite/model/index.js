console.log('💿 [model] invite')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Mongoose = require('mongoose')
const Schema = Mongoose.Schema

// ////////////////////////////////////////////////////////////////////// Schema
// -----------------------------------------------------------------------------
const InviteSchema = new Schema({
  verses: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'verses',
        required: false
      }
    ],
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'accepted', 'expired'],
    default: 'pending'
  },
  expires_at: {
    type: Date,
    required: true
  },
  created_by: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  minimize: false
})

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
module.exports = Mongoose.model('invites', InviteSchema)
