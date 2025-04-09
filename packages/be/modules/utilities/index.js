console.log('📦 [module] utilities')

// ///////////////////////////////////////////////////////// Imports & Variables
// -----------------------------------------------------------------------------
const Fs = require('fs-extra')
const Filesize = require('filesize')
const Mongoose = require('mongoose')
const { Types: { ObjectId } } = Mongoose
const { io } = require('socket.io-client')
const https = require('https')
const axios = require('axios')

const MC = require('@Root/config')

// /////////////////////////////////////////////////////////////////// Functions
// -----------------------------------------------------------------------------
// //////////////////////////////////////////////////////////// RunStartupChecks
const RunStartupChecks = (checks) => {
  const len = Object.keys.length
  if (len === 0) { return }
  Object.keys(checks).forEach((key) => {
    const check = checks[key]
    if (!check.item) {
      throw new Error(check.message)
    }
  })
}

// //////////////////////////////////////////////////////////////////// SendData
const SendData = (res, code, message, payload) => {
  res.status(code)
  res.json({
    code,
    message,
    payload
  })
}

// ///////////////////////////////////////////////////////////////////// Slugify
const Slugify = (text, type = 'dash') => {
  if (type === 'dash') {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w-]+/g, '') // Remove all non-word chars
      .replace(/--+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, '') // Trim - from end of text
  } else if (type === 'underscore') {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '_') // Replace spaces with _
      .replace(/[^\w_]+/g, '') // Remove all non-word chars
      .replace(/__+/g, '_') // Replace multiple _ with single _
      .replace(/^_+/, '') // Trim _ from start of text
      .replace(/_+$/, '') // Trim _ from end of text
  } else if (type === 'underscore-no-trim') {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '_') // Replace spaces with _
      .replace(/[^\w_]+/g, '') // Remove all non-word chars
      .replace(/__+/g, '_') // Replace multiple _ with single _
  } else {
    return 'Incompatible "Type" specified. Must be type "dash", "underscore", or "underscore-no-trim". Default is "dash"'
  }
}

// ///////////////////////////////////////////////////////////////// FormatBytes
const FormatBytes = (bytes) => {
  return Filesize(bytes, { standard: 'iec', base: 2 })
}

// ////////////////////////////////////////////////////////////////// RemoveKeys
const RemoveKeys = (obj, keys) => {
  const mapItem = (item) => {
    const compiled = {}
    Object.keys(item).forEach((key) => {
      if (!keys.includes(key)) {
        compiled[key] = item[key]
      }
    })
    return compiled
  }
  return new Promise((resolve, reject) => {
    if (typeof obj !== 'object') { reject(new Error('[Function: RemoveKeys] An object or an array of objects must be provided')) }
    const len = obj.length
    let compiled = {}
    if (!Array.isArray(obj)) {
      compiled = mapItem(obj)
    } else {
      compiled = []
      for (let i = 0; i < len; i++) {
        compiled.push(mapItem(obj[i]))
      }
    }
    resolve(compiled)
  })
}

// /////////////////////////////////////////////////////////////////// CopyFiles
const CopyFiles = async (from, to, disallowed = ['.DS_Store']) => {
  const options = {
    overwrite: true,
    filter: (src, dest) => {
      if (!disallowed.includes(src.split('/').pop())) { return true }
      return false
    }
  }
  try {
    return await Fs.copySync(from, to, options)
  } catch (e) {
    console.log('======== [Function: CopyFiles] CopyFiles utility error')
    console.log(e)
    throw e
  }
}

// //////////////////////////////////// Convert Seconds To Hours|Minutes|Seconds
const SecondsToHms = (seconds) => {
  const input = Number(seconds)
  const h = Math.floor(input / 3600)
  const m = Math.floor(input % 3600 / 60)
  const s = Math.floor(input % 3600 % 60)
  const hDisplay = h > 0 ? h + (h === 1 ? ' hour, ' : ' hours, ') : ''
  const mDisplay = m > 0 ? m + (m === 1 ? ' minute, ' : ' minutes, ') : ''
  const sDisplay = s > 0 ? s + (s === 1 ? ' second' : ' seconds') : ''
  return hDisplay + mDisplay + sDisplay
}

// ///////////////////////////////////////////////////////////// GetFileFromDisk
const GetFileFromDisk = async (path = false, parseJson = false) => {
  try {
    if (!path) { return false }
    if (!Fs.existsSync(path)) { return false }
    let file = await Fs.readFileSync(path)
    if (parseJson) { file = JSON.parse(file) }
    return file
  } catch (e) {
    return false
  }
}

// //////////////////////////////////////////////////////////// ParseQuerySearch
const ParseQuerySearch = async (search = '') => {
  return new Promise((resolve) => {
    resolve(search.replace(/([.\-+|?*$<>!?=^{}[]()\\])/g, '\\$1'))
  })
}

// ///////////////////////////////////////////////////// GenerateWebsocketClient
const GenerateWebsocketClient = () => {
  https.globalAgent.options.rejectUnauthorized = false
  return io(MC.backendUrl, {
    withCredentials: true,
    secure: true,
    // ca: Fs.readFileSync(`${MC.repoRoot}/localhost_cert.pem`, 'ascii'),
    agent: https.globalAgent
  })
}

// /////////////////////////////////////////////////////////////////// GetSocket
const GetSocket = (socketId) => {
  return MC.socket.io.sockets.sockets.get(socketId)
}

// ///////////////////////////////////////////////////////////// IsValidObjectId
const IsValidObjectId = (incoming) => {
  try {
    const id = `${incoming}`
    const cast = new ObjectId(id)
    return cast.toString() === id
  } catch (e) {
    return false
  }
}

/**
 * Converts HSL color values to a hex color code
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} Hex color code (e.g., "#FF0000")
 */
const HslToHex = (h, s, l) => {
  // Convert HSL values to 0-1 range
  h = h / 360
  s = s / 100
  l = l / 100
  let r, g, b
  if (s === 0) {
    // Achromatic (gray)
    r = g = b = l
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  // Convert RGB to hex
  const toHex = (x) => {
    const hex = Math.round(x * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Converts a hex color code to HSL values
 * @param {string} hex - Hex color code (e.g., "#FF0000" or "FF0000")
 * @returns {object} Object containing h, s, l values
 */
const HexToHsl = (hex) => {
  // Remove the hash if it exists
  hex = hex.replace('#', '')
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = (max + min) / 2
  let s = (max + min) / 2
  if (max === min) {
    h = s = 0 // achromatic
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

// ///////////////////////////////////////////////////// GetThingieConsistencies
const GetThingieConsistencies = async (thingie, upload) => {
  try {
    let consistencies = []
    const hexes = []
    for (let i = 0; i < upload.palette.length; i++) {
      const rgb = upload.palette[i]
      const color = await axios.get(`https://www.thecolorapi.com/id?rgb=${rgb[0]},${rgb[1]},${rgb[2]}`)
      const colorWithoutSpaces = color.data.name.value.replaceAll(' ', '').toLowerCase().substring(0, 9)
      const anagrams = await axios.get(`http://anagramica.com/best/:${colorWithoutSpaces}`)
      consistencies.push(color.data.name.value.toLowerCase())
      consistencies = consistencies.concat(anagrams.data.best)
      hexes.push(color.data.hex.value)
    }
    consistencies = [...new Set(consistencies)]
    await MC.model.Thingie.findOneAndUpdate(
      { _id: thingie._id },
      { colors: hexes, consistencies },
      { new: true }
    )
  } catch (e) {
    console.log('Error getting image thingie consistencies')
    console.log(e)
  }
}

// ////////////////////////////////////////////////////////// GetThingieClipPath
const GetThingieClipPath = async (pathData, mode) => {
  try {
    if (pathData) {
      const xValues = pathData.filter((num, i) => i % 2 === 0).map(num => num / 200)
      const yValues = pathData.filter((num, i) => i % 2 === 1).map(num => num / 200)
      const calcRange = (array) => {
        const min = Math.min(...array)
        const max = Math.max(...array)
        return {
          diff: max - min,
          min
        }
      }
      const normalized = []
      const rangeX = calcRange(xValues)
      const normalizedX = xValues.map(val => (val - rangeX.min) / rangeX.diff)
      const rangeY = calcRange(yValues)
      const normalizedY = yValues.map(val => (val - rangeY.min) / rangeY.diff)
      for (let i = 0; i < normalizedX.length; i++) {
        normalized.push([normalizedX[i], normalizedY[i]])
      }
      if (mode === 'bezier') { // if mode is bezier smooth the path to a curve
        const smoothing = 0.2
        const line = (pointA, pointB) => {
          const lengthX = pointB[0] - pointA[0]
          const lengthY = pointB[1] - pointA[1]
          return {
            length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
            angle: Math.atan2(lengthY, lengthX)
          }
        }
        const controlPoint = (current, previous, next, reverse) => {
          const p = previous || current
          const n = next || current
          const o = line(p, n)
          const angle = o.angle + (reverse ? Math.PI : 0)
          const length = o.length * smoothing
          const x = current[0] + Math.cos(angle) * length
          const y = current[1] + Math.sin(angle) * length
          return [x, y]
        }
        const bezierCommand = (point, i, a) => {
          const cps = controlPoint(a[i - 1], a[i - 2], point)
          const cpe = controlPoint(point, a[i - 1], a[i + 1], true)
          return `C ${cps[0]},${cps[1]} ${cpe[0]},${cpe[1]} ${point[0]},${point[1]}`
        }
        const d = normalized.reduce((acc, point, i, a) => i === 0
          ? `M ${point[0]},${point[1]}`
          : `${acc} ${bezierCommand(point, i, a)}`
        , '')
        return d
      } else if (mode === 'linear') { // if mode is not bezier return linear path
        const coords = []
        const len = normalized.length
        for (let i = 0; i < len; i++) {
          const string = i ? `${normalized[i][0]} ${normalized[i][1]}` : `M${normalized[i][0]} ${normalized[i][1]}`
          coords.push(string)
        }
        return coords.join(' ') + 'Z'
      }
      return pathData.join(' ')
    }
    return ''
  } catch (e) {
    console.log(e)
  }
}

// ///////////////////////////////////////////////////////////////////// Exports
// -----------------------------------------------------------------------------
module.exports = {
  RunStartupChecks,
  SendData,
  Slugify,
  FormatBytes,
  RemoveKeys,
  CopyFiles,
  SecondsToHms,
  GetFileFromDisk,
  ParseQuerySearch,
  GenerateWebsocketClient,
  GetSocket,
  IsValidObjectId,
  HslToHex,
  HexToHsl,
  GetThingieConsistencies,
  GetThingieClipPath
}
