// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useFilterDuplicatePortals = async portals => {
  const len = portals.length
  const active = []
  for (let i = 0; i < len; i++) {
    const portal = portals[i]
    if (portal.manual) {
      active.push(portal)
      continue
    }
    const a = portal.vertices[0].location
    const b = portal.vertices[1].location
    const duplicate = active.some(el => {
      const u = el.vertices[0].location
      const v = el.vertices[1].location
      return (a === u && b === v) || (a === v && b === u)
    })
    if (!duplicate) {
      active.push(portal)
    }
  }
  return active
}
