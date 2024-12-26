// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import { defineStore } from 'pinia'

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export const useZeroAlertStore = defineStore('zero-alert', () => {
  // ===================================================================== state
  const alerts = ref({})

  // =================================================================== actions

  /**
   * @method setAlert
   */

  const setAlert = payload => {
    alerts.value[payload.id] = payload
  }

  /**
   * @method getAlert
   */

  const getAlert = alertId => {
    return alerts.value[alertId]
  }

  /**
   * @method removeAlert
   */

  const removeAlert = alertId => {
    delete alerts.value[alertId]
  }

  /**
   * @method updateAlertData
   */

  const updateAlertData = (alertId, payload) => {
    alerts.value[alertId].data = payload
  }

  /**
   * @method openAlert
   */

  const openAlert = (alertId, data) => {
    Object.assign(alerts.value[alertId], {
      status: 'open',
      data
    })
  }

  /**
   * @method closeAlert
   */

  const closeAlert = alertId => {
    const alert = alerts.value[alertId]
    if (alert) {
      Object.assign(alert, {
        status: 'closed',
        data: null
      })
    }
  }

  // ==================================================================== return
  return {
    // ----- state
    alerts,
    // ----- actions
    setAlert,
    getAlert,
    removeAlert,
    updateAlertData,
    openAlert,
    closeAlert
  }
})
