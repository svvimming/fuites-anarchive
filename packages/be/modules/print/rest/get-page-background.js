console.log('💡 [endpoint] /get-page-background')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
const mongoInstances = Object.keys(MC.mongoInstances)
for (let i = 0; i < mongoInstances.length; i++) {
  const instance = mongoInstances[i]
  MC.app.get(`/${instance}/get-page-background`, async (req, res) => {
    try {
      const query = req.query
      let print
      if (query.print && query.print !== 'undefined') {
        print = await MC.mongoInstances[instance].model.Print.findOne({ _id: query.print })
      }
      if (query.page && query.page !== 'undefined') {
        print = await MC.mongoInstances[instance].model.Print.findOne({ page: query.page })
      }
      SendData(res, 200, 'Print retrieved successfully', print)
    } catch (e) {
      console.log(`============== [Endpoint: /${instance}/get-page-background]`)
      console.log(e)
      SendData(res, 500, 'Something went wrong retrieving page backgound.')
    }
  })
}
