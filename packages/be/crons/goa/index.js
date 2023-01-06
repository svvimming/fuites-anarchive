/**
 *
 * ⏱️️ [Cron | every 5 minutes]
 * GOA scans through the spazes database and
 * accesses/changes spaze states as well as
 * thingie propensities to leave a leaking space.
 *
 */
console.log('🔱 [cron] GOA')

// ///////////////////////////////////////////////////// Imports + general setup
// -----------------------------------------------------------------------------
const MC = require('../../config')

// /////////////////////////////////////////////////////////////////// Functions
// ------------------------------------------------------- ThingiePreaccelerator
const thingiePreaccelerator = async () => {
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
    console.log('========= [Function: GodessOfAnarchy - thingiePreaccelerator]')
    console.log(e)
  }
}

// ///////////////////////////////////////////////////////////////////////// GOA
// -----------------------------------------------------------------------------
const spazePreaccelerator = async () => {
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
  } catch (e) {
    console.log('============================= [Function: spazePreaccelerator]')
    console.log(e)
  }
}

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------
MC.app.on('mongoose-connected', async () => {
  console.log('🔱 Godess Of Anarchy started')
  try {
    await spazePreaccelerator()
    await thingiePreaccelerator()
    console.log('🔱 GOA updates completed')
    process.exit(0)
  } catch (e) {
    console.log('===================================== [Cron: GodessOfAnarchy]')
    console.log(e)
    process.exit(0)
  }
})
