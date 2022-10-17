console.log('📦 [module] utilities')

// ///////////////////////////////////////////////////////// Imports & Variables
// -----------------------------------------------------------------------------
const Fs = require('fs-extra')
const Filesize = require('filesize')
const Mongoose = require('mongoose')
const { Types: { ObjectId } } = Mongoose
const { io } = require('socket.io-client')
const https = require('https')

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
    ca: Fs.readFileSync(`${MC.repoRoot}/localhost_cert.pem`, 'ascii'),
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
  IsValidObjectId
}