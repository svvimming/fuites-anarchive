console.log('💡 [endpoint] /get-page')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
const mongoInstances = Object.keys(MC.mongoInstances)
for (let i = 0; i < mongoInstances.length; i++) {
  const instance = mongoInstances[i]
  MC.app.get(`/${instance}/get-pages`, async (req, res) => {
    try {
      const pages = await MC.mongoInstances[instance].model.Page
        .find({})
        .populate({
          path: 'portal_refs',
          populate: { path: 'thingie_ref', select: 'colors' }
        })
      SendData(res, 200, 'Dataset retrieved successfully', pages)
    } catch (e) {
      console.log(`======================== [Endpoint: /${instance}/get-pages]`)
      console.log(e)
      SendData(res, 500, 'Something went wrong. Please try again.')
    }
  })
}
