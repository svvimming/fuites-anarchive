console.log('💡 [endpoint] /get-thingies')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
const mongoInstances = Object.keys(MC.mongoInstances)
for (let i = 0; i < mongoInstances.length; i++) {
  const instance = mongoInstances[i]
  MC.app.get(`/${instance}/get-thingies`, async (req, res) => {
    try {
      const locations = req.query.locations
      const thingies = await MC.mongoInstances[instance].model.Thingie.find({
        location: locations
      }).populate({
        path: 'file_ref',
        select: 'filename file_ext aspect'
      })
      SendData(res, 200, 'Dataset retrieved successfully', thingies)
    } catch (e) {
      console.log(`===================== [Endpoint: /${instance}/get-thingies]`)
      console.log(e)
      SendData(res, 500, 'Something went wrong. Please try again.')
    }
  })
}
