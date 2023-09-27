/*
 *
 * 🔌 [Plugin | Auth] Helpers
 *
 */

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import Axios from 'axios'
import Cookie from 'cookie'
import { Agent } from 'https'

// /////////////////////////////////////////////////////////////////// Functions
// -----------------------------------------------------------------------------
// //////////////////////////////////////////////////// CreateAxiosAuthTransport
const CreateAxiosAuthTransport = (req, baseURL) => {
  return Axios.create({
    withCredentials: true,
    baseURL,
    httpsAgent: new Agent({
      rejectUnauthorized: false
    }),
    ...process.server && {
      headers: {
        Cookie: req.headers.cookie || ''
      }
    }
  })
}

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export default ({ $config, req }, inject) => {
  inject('axiosAuth', CreateAxiosAuthTransport(req, $config.backendUrl))
}
