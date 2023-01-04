/**
 *
 * ⏱️️ [Cron | every 5 minutes]
 * GOA scans through the spazes database and
 * accesses/changes spaze states as well as
 * thingie propensities to leave a leaking space.
 *
 * ⏱️️ [Cron | every hour]
 * GOA migrator moves thingies from leaking spaces to
 * new spazes based on their preacceleration
 *
 */
console.log('⏱️️  [cron] GOA')

// ///////////////////////////////////////////////////// Imports + general setup
// -----------------------------------------------------------------------------
const NodeCron = require('node-cron')

const MC = require('../../config')

// /////////////////////////////////////////////////////////////////// Functions
// ------------------------------------------------------------- ThingieMigrator
const GOAThingieMigrator = async () => {
  try {
    const date = new Date()
    console.log(`GOA - migrator: ${date}`)
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
              last_update_token: 'godess-of-anarchy',
              record_new_location: true
            })
          }
        }
      }
      if (migrations.length) {
        console.log(migrations)
        for (let j = 0; j < migrations.length; j++) {
          MC.socket.io.to('cron|goa').emit('module|goa-migrate-thingie|payload', migrations[j])
        }
      }
    }
  } catch (e) {
    console.log('=============== [Function: GodessOfAnarchy - ThingieMigrator]')
    console.log(e)
  }
}

// ------------------------------------------------------- ThingiePreaccelerator
const ThingiePreaccelerator = async () => {
  try {
    const spazes = await MC.model.Spaze.find({})
    for (let i = 0; i < spazes.length; i++) {
      const spaze = spazes[i]
      const thingies = await MC.model.Thingie.find({ location: spaze.name })
      if (thingies.length) {
        const points = thingies.map((thingie) => {
          return {
            x: thingie.at.x,
            y: thingie.at.y,
            m: thingie.width
          }
        })
        const massPositionsX = points.reduce((collector, point) => collector + point.x * point.m, 0)
        const massPositionsY = points.reduce((collector, point) => collector + point.y * point.m, 0)
        const massSum = points.reduce((collector, point) => collector + point.m, 0)
        const centerOfMassX = massPositionsX / massSum
        const centerOfMassY = massPositionsY / massSum
        const spazeCenterOfMass = [centerOfMassX, centerOfMassY]
        const thingieData = thingies.map((thingie) => {
          const position = [thingie.at.x + thingie.width / 2, thingie.at.y]
          const deltaX = position[0] - spazeCenterOfMass[0]
          const deltaY = position[1] - spazeCenterOfMass[1]
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
          return {
            thingie_id: thingie._id,
            movement: thingie.update_count ? thingie.update_count : 0,
            weight: thingie.width,
            distance
          }
        })
        const minMovement = Math.min(...thingieData.map(data => data.movement))
        const preaccelerations = thingieData.map((data) => {
          const preacceleration = (data.movement - minMovement) * data.distance / data.weight
          return {
            updateOne: {
              filter: { _id: data.thingie_id },
              update: { preacceleration }
            }
          }
        })
        await MC.model.Thingie.bulkWrite(preaccelerations)
      }
    }
  } catch (e) {
    console.log('========= [Function: GodessOfAnarchy - ThingiePreaccelerator]')
    console.log(e)
  }
}

// ///////////////////////////////////////////////////////////////////////// GOA
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
      const saturated = totalBytes > 40000000 || spazeThingies.length > 40
      if (saturated && spaze.state === 'clumping') { // change spaze state to metastable
        const updated = await MC.model.Spaze
          .findOneAndUpdate({ _id: spaze._id }, { state: 'metastable' }, { new: true })
          .populate({
            path: 'portal_refs',
            populate: { path: 'thingie_ref', select: 'colors' }
          })
        MC.socket.io.to('cron|goa').emit('module|spaze-state-update|payload', updated)
      } else if (totalBytes <= 16666667 && spazeThingies.length <= 40 && spaze.state === 'leaking') { // change spaze state to clumping
        const updated = await MC.model.Spaze
          .findOneAndUpdate({ _id: spaze._id }, { state: 'clumping' }, { new: true })
          .populate({
            path: 'portal_refs',
            populate: { path: 'thingie_ref', select: 'colors' }
          })
        MC.socket.io.to('cron|goa').emit('module|spaze-state-update|payload', updated)
      }
    }
    ThingiePreaccelerator()
  } catch (e) {
    console.log('================================= [Function: GodessOfAnarchy]')
    console.log(e)
  }
}

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------

NodeCron.schedule('*/5 * * * *', () => { GodessOfAnarchy() })
NodeCron.schedule('0 */1 * * *', () => { GOAThingieMigrator() })
