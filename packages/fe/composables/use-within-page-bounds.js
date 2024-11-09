// ////////////////////////////////////////////////////////////////////// Import
// -----------------------------------------------------------------------------
import { storeToRefs } from "pinia"
import { useVerseStore } from "../stores/verse"

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useWithinPageBounds = (point, canvas, scene) => {
  const verseStore = useVerseStore()
  const { zoom } = storeToRefs(verseStore)

  const scale = Math.pow(2, zoom.value)
  const zoomSquared = Math.pow(2, zoom.value + 1)
  const cw = canvas.width || 0
  const ch = canvas.height || 0
  const upperX = ((scene.x * scale) - cw) * (1 / zoomSquared)
  const lowerX = -1 * upperX
  const upperY = ((scene.y * scale) - ch) * (1 / zoomSquared)
  const lowerY = -1 * upperY

  console.log(zoomSquared)
  return {
    x: Math.max(lowerX, Math.min(point.x, upperX)),
    y: Math.max(lowerY, Math.min(point.y, upperY))
  }
}
