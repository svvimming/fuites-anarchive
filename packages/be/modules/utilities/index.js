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

// ///////////////////////////////////////////////////// GetThingieConsistencies
const GetThingieConsistencies = async (thingie, upload) => {
  let consistencies = []
  const hexes = []
  if (thingie.thingie_type === 'image') {
    try {
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
      const updated = await MC.model.Thingie.findOneAndUpdate(
        { _id: thingie._id },
        { colors: hexes, consistencies },
        { new: true }
      )
      console.log(updated)
    } catch (e) {
      console.log('Error getting image thingie consistencies')
      console.log(e)
    }
  }
  if (thingie.thingie_type === 'sound') {
    try {
      const recentThingies = await MC.model.Thingie.find({ last_update_token: thingie.creator_token, thingie_type: ['image', 'text'] })
      if (recentThingies.length) {
        const recent = recentThingies[Math.floor(Math.random() * recentThingies.length)]
        const color = recent.colors[Math.floor(Math.random() * recent.colors.length)]
        const updated = await MC.model.Thingie.findOneAndUpdate(
          { _id: thingie._id },
          { colors: [color] },
          { new: true }
        )
        console.log(updated)
      }
    } catch (e) {
      console.log('Error getting sound thingie consistencies')
      console.log(e)
    }
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
  GetThingieConsistencies,
  GetThingieClipPath
}
