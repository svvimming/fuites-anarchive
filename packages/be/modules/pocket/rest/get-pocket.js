console.log('💡 [endpoint] /get-pocket')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
const mongoInstances = Object.keys(MC.mongoInstances)
for (let i = 0; i < mongoInstances.length; i++) {
  const instance = mongoInstances[i]
  MC.app.get(`/${instance}/get-pocket`, async (req, res) => {
    try {
      const token = req.query.token
      const pocket = await MC.mongoInstances[instance].model.Pocket.findOne({ token }).exec()
      SendData(res, 200, 'Dataset retrieved successfully', pocket)
    } catch (e) {
      console.log(`======================= [Endpoint: /${instance}/get-pocket]`)
      console.log(e)
      SendData(res, 500, 'Something went wrong. Please try again.')
    }
  })
}
