// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import Chalk from 'chalk'

import { useZeroAuthStore } from '../stores/use-zero-auth-store'
import { useZeroToasterStore } from '@/../zero-core/modules/toaster/stores/use-zero-toaster-store'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useHandleFetchError = (e, allowToast = [], disallowToast = []) => {
  const { $bus } = useNuxtApp()
  const serverEnv = useRuntimeConfig().public.serverEnv
  const toasterStore = useZeroToasterStore()
  const authStore = useZeroAuthStore()
  let message = e.statusMessage
  /**
   * Log errors in non-production systems
   */
  if (serverEnv !== 'production') {
    console.log('\n')
    if (e.status && message) {
      console.log(`${Chalk.bold.red(e.status)}`, '→', message)
    } else {
      console.log(Chalk.bold.red('error'))
    }
    console.log(e.stack)
    console.log('\n')
  }
  /**
   * Unauthenticated, usually because session has expired
   */
  if (e.status === 401) {
    authStore.setAuthState('unauthenticated')
    $bus.$emit('session-expired')
  }
  /**
   * Unauthorized, user does not have the required permissions
   */
  else if (e.status === 403 && allowToast.includes(403)) {
    if (message.includes('Resource not accessible by integration')) {
      message = 'You do not have the required repo permissions to perform this action'
    }
    toasterStore.addMessage({
      type: 'error',
      text: message
    })
  }
  /**
   * Examples:
   *   - Incorrect input
   *   - Input does not match a db entry
   *   - db entry already exists
   */
  else if (e.status === 422 && allowToast.includes(422)) {
    toasterStore.addMessage({
      type: 'error',
      text: message
    })
  }
  /**
   * Attempting to C[RUD] a file that has already been C[RUD]ed by someone else.
   * Meaning, file content has changed.
   */
  else if (e.status === 409 && allowToast.includes(409)) {
    toasterStore.addMessage({
      type: 'error',
      text: message
    })
  }
  /**
   * All other error codes, display a toast
   */
  else if (allowToast !== false || Array.isArray(allowToast)) {
    if (!disallowToast.includes(e.status)) {
      toasterStore.addMessage({
        type: 'error',
        text: 'Something went wrong, please try again'
      })
    }
  }
}
