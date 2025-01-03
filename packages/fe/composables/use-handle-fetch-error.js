// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import Chalk from 'chalk'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useHandleFetchError = (e, func) => {
  const serverEnv = useRuntimeConfig().public.serverEnv
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
    console.log(e)
    console.log(func)
  }
}
