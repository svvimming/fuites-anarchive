console.log('💡 [endpoint] /get-thingies')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.get('/get-thingies', async (req, res) => {
  try {
    const location = req.query.location
    const verse = req.query.verse
    const pocketId = req.query.pocketId
    const query = {
      $or: pocketId ? [{ location }, { pocket_ref: pocketId }] : [{ location }],
      verse
    }
    const thingies = await MC.model.Thingie.find(query).populate({
      path: 'file_ref',
      select: 'filename file_ext file_url'
    })
    SendData(res, 200, 'Dataset retrieved successfully', thingies)
  } catch (e) {
    console.log('===================== [Endpoint: /get-thingies]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
