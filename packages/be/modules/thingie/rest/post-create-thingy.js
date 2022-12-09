console.log('💡 [endpoint] /post-create-thingie')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')
const axios = require('axios')

const MC = require('@Root/config')

// /////////////////////////////////////////////////////////////////// Functions
const getThingieConsistencies = async (thingie, upload) => {
  let consistencies = []
  const hexes = []
  if (thingie.thingie_type === 'image') {
    try {
      for (let i = 0; i < upload.palette.length; i++) {
        const rgb = upload.palette[i]
        const color = await axios.get(`https://www.thecolorapi.com/id?rgb=${rgb[0]},${rgb[1]},${rgb[2]}`)
        const colorWithoutSpaces = color.data.name.value.replaceAll(' ', '').toLowerCase().substring(0, 9)
        const anagrams = await axios.get(`http://anagramica.com/best/:${colorWithoutSpaces}`)
        consistencies.push(color.data.name.value.toLowerCase())
        consistencies = consistencies.concat(anagrams.data.best)
        hexes.push(color.data.hex.value)
      }
      consistencies = [...new Set(consistencies)]
      const updated = await MC.model.Thingie.findOneAndUpdate(
        { _id: thingie._id },
        { colors: hexes, consistencies },
        { new: true }
      )
      console.log(updated)
    } catch (e) {
      console.log(e)
    }
  }
}

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.post('/post-create-thingie', async (req, res) => {
  try {
    const body = req.body
    const upload = await MC.model.Upload.findById(body.file_id)
    if (!upload && body.thingie_type !== 'text') {
      throw new Error('File could not be uploaded. Please try again.')
    }
    const created = await MC.model.Thingie.create({
      file_ref: body.file_id,
      location: body.location,
      at: {
        x: body.at ? body.at.x : Math.random() * 300,
        y: body.at ? body.at.y : Math.random() * 300,
        z: 1
      },
      width: 80,
      angle: 0,
      creator_token: body.creator_token,
      thingie_type: body.thingie_type,
      text: body.text,
      consistencies: [],
      colors: []
    })
    await created.populate({
      path: 'file_ref',
      select: 'filename file_ext'
    })
    MC.socket.io.to('thingies').emit('module|post-create-thingie|payload', created)
    SendData(res, 200, 'Thingie successfully created', created)
    getThingieConsistencies(created, upload)
  } catch (e) {
    console.log('================== [Endpoint: /post-create-thingie]')
    console.log(e)
    SendData(res, 500, 'Something went wrong. Please try again.')
  }
})
