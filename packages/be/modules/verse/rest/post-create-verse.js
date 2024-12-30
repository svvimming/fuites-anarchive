console.log('💡 [endpoint] /post-create-verse')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { SendData } = require('@Module_Utilities')

const MC = require('@Root/config')

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.post('/post-create-verse', async (req, res) => {
  try {
    const body = req.body
    const pocketId = body.pocketId
    const verseName = body.verseName
    const firstPageName = body.firstPageName
    // Check if this Verse already exists
    const verseAlreadyExists = await MC.model.Verse.findOne({ name: verseName })
    if (verseAlreadyExists) {
      SendData(res, 400, 'A verse with this name already exists!', false)
      return
    }
    // Create the new Page
    const createdPage = await MC.model.Page.create({
      initiator_pocket_ref: pocketId,
      verse: verseName,
      name: firstPageName
    })
    // Create the new Verse
    const createdVerse = await MC.model.Verse.create({
      name: verseName,
      page_refs: [createdPage._id]
    })
    // Update the token with access to the new Verse
    const pocket = await MC.model.Pocket
      .findOneAndUpdate({ _id: pocketId }, {
        $push: { verses: createdVerse._id }
      }, { new: true })
      .populate({
        path: 'verses',
        select: 'name',
        populate: { path: 'page_refs', select: 'name' }
      })
    // Send the updated Pocket
    SendData(res, 200, 'Verse succesfully created', pocket)
  } catch (e) {
    console.log('=============================== [Endpoint: /post-create-verse]')
    console.log(e)
    SendData(res, 500, 'Something went wrong while creating a verse. Please try again.')
  }
})
