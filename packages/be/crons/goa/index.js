/**
 *
 * ⏱️️ [Cron | every minute] GOA
 *
 */
console.log('⏱️️  [cron] GOA')

// ///////////////////////////////////////////////////// Imports + general setup
// -----------------------------------------------------------------------------
const NodeCron = require('node-cron')

const MC = require('../../config')

// /////////////////////////////////////////////////////////////////// Functions
// -----------------------------------------------------------------------------
const GodessOfAnarchy = async () => {
  try {
    const spazes = await MC.model.Spaze.find({})
    const thingies = await MC.model.Thingie.find({}).populate({
      path: 'file_ref',
      select: 'filename file_ext filesize'
    })
    for (let i = 0; i < spazes.length; i++) {
      const spaze = spazes[i]
      let totalBytes = 0
      const spazeThingies = thingies.filter(thingie => thingie.location === spaze.name)
      spazeThingies.forEach((thingie) => {
        if (thingie.file_ref) {
          totalBytes += thingie.file_ref.filesize
        }
      })
      if (totalBytes > 2000000 && spaze.state === 'clumping') {
        const updated = await MC.model.Spaze.findOneAndUpdate({ _id: spaze._id }, { state: 'metastable'}, { new: true })
        MC.socket.io.to('cron|goa').emit('module|spaze-state-update|payload', updated)
      }
    }
  } catch (e) {
    console.log('================================= [Function: GodessOfAnarchy]')
    console.log(e)
  }
}

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------

NodeCron.schedule('* * * * *', () => { GodessOfAnarchy() })
