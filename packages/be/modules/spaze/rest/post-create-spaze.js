console.log('💡 [endpoint] /post-create-spaze')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.post('/post-create-spaze', async (req, res) => {
  try {
    const body = req.body
    const created = await MC.model.Spaze.create({
      name: body.spaze_name,
      connections: body.connections,
      creator_token: body.creator_token
    })
    SendData(res, 200, 'Spaze succesfully created', created)
  } catch (e) {
    console.log('================== [Endpoint: /post-create-spaze]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
