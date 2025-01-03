// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import { defineNuxtPlugin } from '#imports'
import io from 'socket.io-client'

// /////////////////////////////////////////////////////////////////// Functions
// -----------------------------------------------------------------------------
/**
 * @method connect
 */

const connect = () => {
  const websocketStore = useWebsocketStore()
  const { socket } = storeToRefs(websocketStore)
  const { $bus } = useNuxtApp()
  return new Promise(resolve => {
    let interval
    websocketStore.setWebsocketConnection(io(useRuntimeConfig().public.websocketUrl, {
      withCredentials: true
    }))
    socket.value.on('disconnect', reason => {
      if (reason === 'ping timeout' || reason === 'transport close' || reason === 'transport error') {
        interval = setInterval(() => {
          socket.value = io(useRuntimeConfig().public.websocketUrl, {
            withCredentials: true
          })
          clearInterval(interval)
        }, 50)
      }
    })
    socket.value.on('connect', () => {
      clearInterval(interval)
      $bus.$emit('socket.io-connected', socket.value)
      resolve(socket.value)
    })
  })
}

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export default defineNuxtPlugin(() => {
  return {
    provide: {
      io: {
        connect
      }
    }
  }
})
