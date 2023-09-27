console.log('💡 [endpoint] /post-update-background')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
const mongoInstances = Object.keys(MC.mongoInstances)
for (let i = 0; i < mongoInstances.length; i++) {
  const instance = mongoInstances[i]
  MC.app.post(`/${instance}/post-update-background`, async (req, res) => {
    try {
      const body = req.body
      if (body.print_id) {
        console.log('print id found, updating print')
        await MC.mongoInstances[instance].model.Print
          .findOneAndUpdate({ _id: body.print_id }, { data_url: body.data_url })
        await MC.mongoInstances[instance].model.Page
          .findOneAndUpdate({ name: body.page_name }, { init_screencap: false })
      } else {
        console.log('no print id found, creating print')
        const created = await MC.mongoInstances[instance].model.Print.create({
          page: body.page_name,
          data_url: body.data_url
        })
        await MC.mongoInstances[instance].model.Page
          .findOneAndUpdate({ name: body.page_name }, {
            print_ref: created._id,
            init_screencap: false
          })
      }
      SendData(res, 200, 'Print updated success')
    } catch (e) {
      console.log(`=========== [Endpoint: /${instance}/post-update-background]`)
      console.log(e)
      SendData(res, 500, 'Something went wrong retrieving page backgound.')
    }
  })
}
