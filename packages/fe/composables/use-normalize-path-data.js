/**
 * Composable for normalizing path data coordinates to a specified output range
 * @param {number[]} pathData - Flat array of coordinates [x1, y1, x2, y2, ...]
 * @param {Object} options - Normalization options
 * @param {number} options.containerMax - Desired maximum length of the square container
 * @returns {number[]} Normalized path data in the same format
 */
export const useNormalizePathData = () => {
  const normalizeValue = (value, inputMin, inputMax, outputMin, outputMax) => {
    return ((value - inputMin) / (inputMax - inputMin)) * (outputMax - outputMin) + outputMin
  }

  const normalizePathData = (pathData, options) => {
    if (!Array.isArray(pathData) || pathData.length % 2 !== 0) {
      throw new Error('Path data must be an array with an even number of elements')
    }

    // Calculate input ranges
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (let i = 0; i < pathData.length; i += 2) {
      const x = pathData[i]
      const y = pathData[i + 1]
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }

    const xRange = maxX - minX
    const yRange = maxY - minY
    const { containerMax = 200 } = options

    const xOutputRange = xRange > yRange ? containerMax : (xRange / yRange) * containerMax
    const yOutputRange = yRange > xRange ? containerMax : (yRange / xRange) * containerMax
    const xOutputOffset = xRange > yRange ? 0 : (containerMax - xOutputRange) / 2
    const yOutputOffset = yRange > xRange ? 0 : (containerMax - yOutputRange) / 2
    const xOutputMin = xOutputOffset
    const xOutputMax = xOutputOffset + xOutputRange
    const yOutputMin = yOutputOffset
    const yOutputMax = yOutputOffset + yOutputRange

    return pathData.map((value, index) => {
      if (index % 2 === 0) {
        // X coordinate
        return normalizeValue(value, minX, maxX, xOutputMin, xOutputMax)
      } else {
        // Y coordinate
        return normalizeValue(value, minY, maxY, yOutputMin, yOutputMax)
      }
    })
  }

  return {
    normalizePathData
  }
}
