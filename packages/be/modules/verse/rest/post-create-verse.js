console.log('💡 [endpoint] /post-create-verse')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { createHash } = require('node:crypto')
const { SendData } = require('@Module_Utilities')
const Path = require('path')

const MC = require('@Root/config')

require('dotenv').config({ path: Path.resolve(__dirname, '../../../.env') })

// /////////////////////////////////////////////////////////////////// Functions
// -----------------------------------------------------------------------------
/**
 * @method getRandomColor
 * @desc Returns a random color as a hex string
 * @returns {String}
 */

const getRandomColor = () => {
  const randomColor = Math.floor(Math.random() * 16777215).toString(16)
  return `#${randomColor.padStart(6, '0')}`
}

// //////////////////////////////////////////////////////////////////// Endpoint
// -----------------------------------------------------------------------------
MC.app.post('/post-create-verse', async (req, res) => {
  try {
    const body = req.body
    const pocketId = body.pocketId
    const verseName = body.verseName
    const firstPageName = body.firstPageName
    const token = body.token
    // Check if the token matches the current session
    const salt = process.env.TOKEN_SALT_SECRET
    const hashedToken = createHash('sha256').update(token + salt).digest('hex')
    const checkPocketMatchesToken = await MC.model.Pocket.findOne({ _id: pocketId, token: hashedToken })
    if (!checkPocketMatchesToken) {
      SendData(res, 200, 'The token you provided does not match the current session.', { message: 'The token you provided does not match the current session.', status: 'error', code: 'token-mismatch' })
      return
    }
    // Check if the first page name collides with the compost or pocket
    if (firstPageName === 'compost' || firstPageName === 'pocket') {
      SendData(res, 200, 'Can\'t create a page named after the compost or the pocket.', { message: 'Can\'t create a page named after the compost or the pocket.', status: 'error', code: 'page-name-collision' })
      return
    }
    // Check if this Verse already exists
    const verseAlreadyExists = await MC.model.Verse.findOne({ name: verseName })
    if (verseAlreadyExists) {
      SendData(res, 200, 'A verse with this name already exists!', { message: 'A verse with this name already exists!', status: 'error', code: 'verse-already-exists' })
      return
    }
    // Create the new Page
    const createdPage = await MC.model.Page.create({
      initiator_pocket_ref: pocketId,
      verse: verseName,
      name: firstPageName
    })
    // Create a compost for the new Verse
    const compostPage = await MC.model.Page.create({
      initiator_pocket_ref: pocketId,
      verse: verseName,
      name: 'compost'
    })
    // Create the new Verse
    const createdVerse = await MC.model.Verse.create({
      name: verseName,
      page_refs: [createdPage._id, compostPage._id],
      average_colors: {
        primary: getRandomColor(),
        secondary: getRandomColor()
      }
    })
    // Update the token with access to the new Verse
    const pocket = await MC.model.Pocket
      .findOneAndUpdate({ _id: pocketId }, {
        $push: { verses: createdVerse._id }
      }, { new: true })
      .populate({
        path: 'verses',
        select: 'name settings average_colors public',
        populate: { path: 'page_refs', select: 'name' }
      })
    // Send the updated Pocket
    SendData(res, 200, 'Verse succesfully created', { message: 'Verse succesfully created', status: 'success', pocket })
  } catch (e) {
    console.log('=============================== [Endpoint: /post-create-verse]')
    console.log(e)
    SendData(res, 500, 'Something went wrong while creating a verse. Please try again.')
  }
})
