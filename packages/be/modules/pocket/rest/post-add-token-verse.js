console.log('💡 [endpoint] /post-add-token-verse')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.post('/post-add-token-verse', async (req, res) => {
  try {
    const token = req.body.targetToken
    const verseId = req.body.verseId
    const exists = await MC.model.Pocket.findOne({ token }).exec()
    if (!exists) {
      SendData(res, 200, 'This token does not exist', { type: 'token-not-found', pocket: false })
      return
    }
    if (exists.verses.some(verse => verse._id.toString() === verseId)) {
      SendData(res, 200, 'Token already has access to this verse', { type: 'token-already-has-access', pocket: false })
      return
    }
    const pocket = await MC.model.Pocket
      .findOneAndUpdate({ token }, {
        $push: {
          verses: verseId
        }
      }, { new: true }).populate({
        path: 'verses',
        select: 'name settings average_colors public',
        populate: { path: 'page_refs', select: 'name' }
      })
    SendData(res, 200, 'Verse added to token', { type: 'verse-added-to-token', pocket })
  } catch (e) {
    console.log('=========================== [Endpoint: /post-add-token-verse]')
    console.log(e)
    SendData(res, 400, 'Error adding token to verse', false)
  }
})
