/**
 * @note only use for requests from client to backend
 */

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useFetchAuth = async (endpoint, options = {}) => {
  const config = useRuntimeConfig()
  const method = options.method || 'post'
  const url = endpoint.charAt(0) !== '/' ? `/${endpoint}` : endpoint
  options.url = `${config.public.backendUrl}${url}`
  const headers = Object.assign(
    {},
    options.headers || {},
    useRequestHeaders()
  )
  try {
    const response = await $fetch(`${config.public.backendUrl}${url}`, {
      method,
      headers,
      ...(method === 'post' && { body: options }),
      ...(method === 'get' && { query: options })
    })
    return response.payload
  } catch (e) {
    throw e
  }
}
