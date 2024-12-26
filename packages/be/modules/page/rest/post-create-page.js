console.log('💡 [endpoint] /post-create-page')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// /////////////////////////////////////////////////////////////////// Functions
// -----------------------------------------------------------------------------
const useCreatePageName = thingieConsistencies => {
  if (!thingieConsistencies.length) {
    return false
  }
  const consistencies = thingieConsistencies.join(' ').split(' ')
  let index = Math.floor(Math.random() * consistencies.length)
  let name = consistencies[index]
  consistencies.splice(index, 1)
  if (consistencies.length >= 3 && Math.random() <= 0.5) {
    index = Math.floor(Math.random() * consistencies.length)
    const secondWord = consistencies[index]
    name = `${name}-${secondWord}`
    consistencies.splice(index, 1)
  }
  if (consistencies.length >= 11 && Math.random() <= 0.5) {
    index = Math.floor(Math.random() * consistencies.length)
    const thirdWord = consistencies[index]
    name = `${name}-${thirdWord}`
  }
  return name
}

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.post('/post-create-page', async (req, res) => {
  try {
    const body = req.body
    const verse = body.verse
    const initiatorPocket = body.initiatorPocket
    const creatorThingie = body.creatorThingie
    const name = body.name || useCreatePageName(creatorThingie.consistencies)
    const overflowPage = creatorThingie.location_history[1]?.location
    const pageNameAlreadyExists = await MC.model.Page.findOne({ name })
    if (name === 'pocket') {
      SendData(res, 400, 'Error: cannot name a page \'pocket\'!', false)
      return
    }
    if (!name || pageNameAlreadyExists) {
      SendData(res, 400, 'An error occured while generating a new page name.', false)
      return
    }
    // Create the new page
    const created = await MC.model.Page.create({
      overflow_page: overflowPage || '',
      initiator_pocket_ref: initiatorPocket,
      creator_thingie_ref: creatorThingie._id,
      verse,
      name
    })
    // Add the new page ref to its Verse's document
    await MC.model.Verse.findOneAndUpdate({ name: created.verse }, { $push: { page_refs: created._id } })
    // If created from a tip, set the tipped page to leaking
    if (created.overflow_page) {
      await MC.model.Page.findOneAndUpdate({ name: created.overflow_page }, { state: 'leaking' }, { new: true })
    }
    // Grab a thingie from the compost and add it to the new page
    const compostThingies = await MC.model.Thingie.find({ location: 'compost' }).select('_id at')
    if (compostThingies.length) {
      const thingieToMove = compostThingies[Math.floor(Math.random() * compostThingies.length)]
      await MC.model.Thingie.findOneAndUpdate({ _id: thingieToMove._id }, {
        location: created.name,
        at: Object.assign({}, thingieToMove.at, {
          x: 683 + Math.random() * 1266,
          y: 500 + Math.random() * 800
        })
      }, { new: true })
    }
    SendData(res, 200, 'Page succesfully created', created)
  } catch (e) {
    console.log('=============================== [Endpoint: /post-create-page]')
    console.log(e)
    SendData(res, 500, 'Something went wrong while creating a page. Please try again.')
  }
})
