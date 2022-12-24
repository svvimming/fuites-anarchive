/**
 *
 * ⏱️️ [Cron | every minute] Tunneler creates portals between past thingie locations
 *
 */
console.log('⏱️️  [cron] Tunneler')

// ///////////////////////////////////////////////////// Imports + general setup
// -----------------------------------------------------------------------------
const NodeCron = require('node-cron')

const MC = require('../../config')

// /////////////////////////////////////////////////////////////////// Functions
// ------------------------------------------------------------- createNewPortal
const createNewPortal = async (thingieId, portalName, vertices) => {
  for (let i = 0; i < vertices.length; i++) {
    const vertex = vertices[i]
    if (!vertex.hasOwnProperty('at')) {
      const thingie = await MC.model.Thingie.findById(thingieId)
      vertex.at = {
        x: thingie.at.x + (Math.floor(Math.random() * thingie.width)),
        y: thingie.at.y + (Math.floor(Math.random() * 20))
      }
    }
  }
  const created = await MC.model.Portal.create({
    thingie_ref: thingieId,
    edge: portalName,
    vertices: { a: vertices[0], b: vertices[1] }
  })
  if (created) {
    for (let i = 0; i < vertices.length; i++) {
      const updated = await MC.model.Spaze.findOneAndUpdate(
        { name: vertices[i].location },
        { $push: { portal_refs: created._id } },
        { new: true }
      ).populate({
        path: 'portal_refs',
        populate: { path: 'thingie_ref', select: 'colors' }
      })
      MC.socket.io.to('spazes').emit('module|post-update-spaze|payload', updated)
    }
  }
}

// ----------------------------------------------------------------- closePortal
const closePortal = async (incoming) => {
  const portal = await MC.model.Portal.findById(incoming._id)
  const vertices = [portal.vertices.a, portal.vertices.b]
  for (let i = 0; i < vertices.length; i++) {
    const updated = await MC.model.Spaze.findOneAndUpdate(
      { name: vertices[i].location },
      { $pull: { portal_refs: portal._id } },
      { new: true }
    ).populate({
      path: 'portal_refs',
      populate: { path: 'thingie_ref', select: 'colors' }
    })
    MC.socket.io.to('spazes').emit('module|post-update-spaze|payload', updated)
  }
  const closed = await MC.model.Portal.deleteOne({ id: portal._id })
  console.log(closed)
}

// ---------------------------------------------------- checkPortalThingiesExist
const checkPortalThingiesExist = async () => {
  const allPortals = await MC.model.Portal.find({})
  const portalsMissingThingies = []
  for (let i = 0; i < allPortals.length; i++) {
    const hasThingieRef = await MC.model.Thingie.exists({ _id: allPortals[i].thingie_ref })
    if (!hasThingieRef) {
      portalsMissingThingies.push(allPortals[i]._id)
    }
  }
  for (let j = 0; j < portalsMissingThingies.length; j++) {
    await closePortal(portalsMissingThingies[j])
  }
}

// -------------------------------------------------------------------- Tunneler
const Tunneler = async () => {
  try {
    await checkPortalThingiesExist()
    const thingies = await MC.model.Thingie.find({})
    for (let i = 0; i < thingies.length; i++) {
      const thingie = thingies[i]
      const locations = [...thingie.last_locations].reverse()
      const portals = await MC.model.Portal
        .find({ thingie_ref: thingie._id })
        .sort({ createdAt: 'desc' })
      if (locations.length > 1) {
        for (let j = 0; j < locations.length - 1; j++) {
          const vA = locations[j]
          const vB = locations[j + 1]
          const portalName = `${vA.location}_${vB.location}`
          const portalExists = portals.some(portal => portal.edge === portalName)
          if (!portalExists) {
            createNewPortal(thingie._id, portalName, [vA, vB])
          }
        }
      }
      if (portals.length > (locations.length - 1)) {
        const outdatedPortals = portals.slice(locations.length - 1)
        for (let k = 0; k < outdatedPortals.length; k++) {
          closePortal(outdatedPortals[k]._id)
        }
      }
    }
  } catch (e) {
    console.log('======================================== [Function: Tunneler]')
    console.log(e)
  }
}

// ////////////////////////////////////////////////////////////////// Initialize
// -----------------------------------------------------------------------------
Tunneler()
NodeCron.schedule('* * * * *', () => { Tunneler() })
