console.log('💡 [endpoint] /get-page')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.get('/get-page', async (req, res) => {
  try {
    const verse = req.query.verse
    const name = req.query.page
    const page = await MC.model.Page
      .findOne({ name, verse })
      .populate({
        path: 'portal_refs',
        populate: [
          {
            path: 'thingie_ref',
            select: 'colors'
          },
          {
            path: 'vertices.page_ref',
            select: 'print_refs'
          }
        ]
      })
    SendData(res, 200, 'Dataset retrieved successfully', page)
  } catch (e) {
    console.log('======================================= [Endpoint: /get-page]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
