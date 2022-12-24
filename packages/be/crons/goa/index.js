/**
 *
 * ⏱️️ [Cron | every 5 minutes] GOA scans through the spazes database and accesses/changes spaze states
 *
 */
console.log('⏱️️  [cron] GOA')

// ///////////////////////////////////////////////////// Imports + general setup
// -----------------------------------------------------------------------------
const NodeCron = require('node-cron')

const MC = require('../../config')

// /////////////////////////////////////////////////////////////////// Functions
// -----------------------------------------------------------------------------
const ThingieMigrator = async () => {
  const leaking = await MC.model.Spaze.find({ state: 'leaking' })
  if (leaking.length) {
    for (let i = 0; i < leaking.length; i++) {
      const spaze = leaking[i]
      const thingies = await MC.model.Thingie.find({ location: spaze.name }).sort({ preacceleration: 'desc' })
      if (thingies.length) {
        const teleport = thingies[0]
        console.log(teleport)
      }
    }
  }
}

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
    ThingieMigrator()
  } catch (e) {
    console.log('========= [Function: GodessOfAnarchy - ThingiePreaccelerator]')
    console.log(e)
  }
}

// ///////////////////////////////////////////////////////////////////////// GOA
// -----------------------------------------------------------------------------
const GodessOfAnarchy = async () => {
  try {
    const date = new Date()
    console.log(`GOA: ${date}`)
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
        const updated = await MC.model.Spaze
          .findOneAndUpdate({ _id: spaze._id }, { state: 'metastable' }, { new: true })
          .populate({
            path: 'portal_refs',
            populate: { path: 'thingie_ref', select: 'colors' }
          })
        MC.socket.io.to('cron|goa').emit('module|spaze-state-update|payload', updated)
      } else if (totalBytes <= 1000000 && spaze.state === 'leaking') {
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
GodessOfAnarchy()
NodeCron.schedule('*/5 * * * *', () => { GodessOfAnarchy() })
