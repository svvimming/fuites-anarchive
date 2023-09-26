console.log('💡 [endpoint] /post-update-pocket')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
const mongoInstances = Object.keys(MC.mongoInstances)
for (let i = 0; i < mongoInstances.length; i++) {
  const instance = mongoInstances[i]
  MC.app.post(`/${instance}/post-update-pocket`, async (req, res) => {
    try {
      const body = req.body
      const pocket = await MC.mongoInstances[instance].model.Pocket.findOneAndUpdate(
        { token: body.token },
        { thingies: req.body.thingies },
        { new: true }
      )
      SendData(res, 200, 'Dataset updated successfully', pocket)
    } catch (e) {
      console.log(`=============== [Endpoint: /${instance}/post-update-pocket]`)
      console.log(e)
      SendData(res, 500, 'Something went wrong. Please try again.')
    }
  })
}
