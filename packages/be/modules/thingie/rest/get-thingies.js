console.log('💡 [endpoint] /get-thingies')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.get('/get-thingies', async (req, res) => {
  try {
    const locations = req.query.locations
    const verse = req.query.verse
    const thingies = await MC.model.Thingie.find({
      verse,
      location: locations
    }).populate({
      path: 'file_ref',
      select: 'filename file_ext aspect'
    })
    SendData(res, 200, 'Dataset retrieved successfully', thingies)
  } catch (e) {
    console.log('===================== [Endpoint: /get-thingies]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
