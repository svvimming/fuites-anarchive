/**
 * Composable for transforming path data coordinates
 * @returns {Object} Object containing transformation methods
 */
export const useTransformPathData = () => {
  /**
   * @method normalizeValue
   * @param {number} value - The value to normalize
   * @param {number} inputMin - The minimum value of the input range
   * @param {number} inputMax - The maximum value of the input range
   * @param {number} outputMin - The minimum value of the output range
   * @param {number} outputMax - The maximum value of the output range
   * @returns {number} The normalized value
   */
  const normalizeValue = (value, inputMin, inputMax, outputMin, outputMax) => {
    return ((value - inputMin) / (inputMax - inputMin)) * (outputMax - outputMin) + outputMin
  }

  /**
   * Calculates the ranges and min/max values for x and y coordinates in path data
   * @param {number[]} pathData - Flat array of coordinates [x1, y1, x2, y2, ...]
   * @returns {Object} Object containing range calculations
   * @returns {number} .minX - Minimum x value
   * @returns {number} .maxX - Maximum x value
   * @returns {number} .minY - Minimum y value
   * @returns {number} .maxY - Maximum y value
   * @returns {number} .xRange - Range of x values (maxX - minX)
   * @returns {number} .yRange - Range of y values (maxY - minY)
   */
  const calculatePathRanges = (pathData) => {
    if (!Array.isArray(pathData) || pathData.length % 2 !== 0) {
      throw new Error('Path data must be an array with an even number of elements')
    }

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

    return {
      minX,
      maxX,
      minY,
      maxY,
      xRange,
      yRange
    }
  }

  /**
   * Normalizes the path data coordinates to the specified output range
   * @param {number[]} pathData - Flat array of coordinates [x1, y1, x2, y2, ...]
   * @param {Object} options - Normalization options
   * @param {number} options.containerMax - Desired maximum length of the square container
   * @returns {number[]} Normalized path data in the same format
   */
  const normalizePathData = (pathData, options) => {
    const { minX, maxX, minY, maxY, xRange, yRange } = calculatePathRanges(pathData)
    const { containerMax = 200, centerPath = false } = options

    const xOutputRange = xRange > yRange ? containerMax : (xRange / yRange) * containerMax
    const yOutputRange = yRange > xRange ? containerMax : (yRange / xRange) * containerMax
    const xOutputOffset = centerPath ? (xRange > yRange ? 0 : (containerMax - xOutputRange) / 2) : 0
    const yOutputOffset = centerPath ? (yRange > xRange ? 0 : (containerMax - yOutputRange) / 2) : 0
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
    normalizePathData,
    calculatePathRanges
  }
}
