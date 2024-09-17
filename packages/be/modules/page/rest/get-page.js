console.log('💡 [endpoint] /get-page')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.get('/get-pages', async (req, res) => {
  try {
    const pages = await MC.model.Page
      .find({})
      .populate({
        path: 'portal_refs',
        populate: { path: 'thingie_ref', select: 'colors' }
      })
    SendData(res, 200, 'Dataset retrieved successfully', pages)
  } catch (e) {
    console.log('======================== [Endpoint: /get-pages]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
