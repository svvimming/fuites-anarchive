console.log('💡 [endpoint] /get-verse')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.get('/get-verse', async (req, res) => {
  try {
    const name = req.query.verse
    const verse = await MC.model.Verse.findOne({ name }).exec()
    SendData(res, 200, 'Pocket retrieved successfully', verse)
  } catch (e) {
    console.log('====================================== [Endpoint: /get-verse]')
    console.log(e)
    SendData(res, 200, 'This Verse doesn\'t exist yet', false)
  }
})
