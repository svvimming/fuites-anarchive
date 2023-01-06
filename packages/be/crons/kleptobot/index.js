/**
 *
 * ⏱️️ [Cron | every hour]
 * Kleptobot moves thingies from leaking spaces to
 * new spazes based on their preacceleration
 *
 */
console.log('🤖️ [cron] Kleptobot')

// ///////////////////////////////////////////////////// Imports + general setup
// -----------------------------------------------------------------------------
const MC = require('../../config')

// /////////////////////////////////////////////////////////////////// Functions
// ------------------------------------------------------------- thingieMigrator
const thingieMigrator = async () => {
  try {
    const leaking = await MC.model.Spaze
      .find({ state: 'leaking' })
      .populate({
        path: 'portal_refs',
        populate: { path: 'thingie_ref' }
      })
    if (leaking.length) {
      const migrations = []
      for (let i = 0; i < leaking.length; i++) {
        const spaze = leaking[i]
        const thingies = await MC.model.Thingie.find({ location: spaze.name }).sort({ preacceleration: 'desc' })
        if (thingies.length) {
          const overflow = await MC.model.Spaze.findOne({ overflow_spaze: spaze.name })
          let newSpazeLocation = ''
          if (overflow) {
            newSpazeLocation = overflow.name
          } else if (spaze.portal_refs.length) {
            const portal = spaze.portal_refs[0]
            const connection = portal.edge.split('_').find(name => name !== spaze.name)
            if (connection) {
              newSpazeLocation = connection
            }
          }
          if (newSpazeLocation) {
            migrations.push({
              _id: thingies[0]._id,
              location: newSpazeLocation,
              last_update_token: 'kleptobot',
              record_new_location: true
            })
          }
        }
      }
      if (migrations.length) {
        console.log(migrations)
        for (let j = 0; j < migrations.length; j++) {
          MC.socket.io.to('cron|goa').emit('module|kleptobot-migrate-thingie|payload', migrations[j])
        }
      }
    }
  } catch (e) {
    console.log('===================== [Function: Kleptobot - thingieMigrator]')
    console.log(e)
  }
}

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------
MC.app.on('mongoose-connected', async () => {
  console.log('🤖️ Kleptobot started')
  try {
    await thingieMigrator()
    console.log('🤖️ Kleptobot thingies stolen')
    process.exit(0)
  } catch (e) {
    console.log('=========================================== [Cron: Kleptobot]')
    console.log(e)
    process.exit(0)
  }
})
