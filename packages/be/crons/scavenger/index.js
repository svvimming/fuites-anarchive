/**
 *
 * ⏱️️ [Cron | every day]
 * digests thingies in the compost
 *
 */
console.log('⏱️️  [cron] Scavenger')

// ///////////////////////////////////////////////////// Imports + general setup
// -----------------------------------------------------------------------------
const Path = require('path')
const Fs = require('fs-extra')
const NodeCron = require('node-cron')

const MC = require('../../config')

const UPLOADS_DIR = Path.resolve(`${MC.publicRoot}/uploads`)

// /////////////////////////////////////////////////////////////////// Functions
// --------------------------------------------------------------- deleteThingie
const deleteThingie = async (thingieId) => {
  try {
    const thingie = await MC.model.Thingie.findById(thingieId)
    if (!thingie) {
      throw new Error('File does not exist!')
    }
    if (thingie.thingie_type !== 'text') {
      const fileId = thingie.file_ref
      const upload = await MC.model.Upload.findById(fileId)
      const fileExt = upload.file_ext
      if (!upload) {
        throw new Error('File does not exist!')
      }
      const deletedUpload = await MC.model.Upload.deleteOne(upload)
      const deletedThingie = await MC.model.Thingie.deleteOne(thingie)
      console.log(deletedUpload)
      console.log(deletedThingie)
      Fs.unlink(`${UPLOADS_DIR}/${fileId}.${fileExt}`, (err) => {
        if (err) {
          console.log(err)
        } else {
          console.log(`deleted ${fileId}.${fileExt}`)
        }
      })
    } else {
      const deletedTextThingie = await MC.model.Thingie.deleteOne(thingie)
      console.log(deletedTextThingie)
    }
    console.log(`deleted file ${thingieId}`)
    MC.socket.io.to('thingies').emit('module|post-delete-thingie|payload', thingieId)
  } catch (e) {
    console.log('================================ [Scavenger: /delete-thingie]')
    console.log(e)
  }
}

// ------------------------------------------------------------------- Scavenger
const Scavenger = async () => {
  const now = Date.now()
  const twoWeeks = 1000 * 60 * 60 * 24 * 14 // two weeks in milliseconds
  const twoWeeksAgo = new Date(now - twoWeeks)
  const compostThingies = await MC.model.Thingie.find({
    location: 'compost',
    $or: [
      { compostedAt: { $lt: twoWeeksAgo } },
      { updatedAt: { $lt: twoWeeksAgo } }
    ]
  })
  const len = compostThingies.length
  for (let i = 0; i < len; i++) {
    const thingie = compostThingies[i]
    deleteThingie(thingie._id)
  }
}

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------

NodeCron.schedule('0 0 * * *', () => { Scavenger() })
