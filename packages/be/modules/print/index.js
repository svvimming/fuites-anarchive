console.log('📦 [module] print')

// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const { RunStartupChecks } = require('@Module_Utilities')

const MC = require('@Root/config')

// ////////////////////////////////////////////////////////////// Startup Checks
// -----------------------------------------------------------------------------
const checks = []
RunStartupChecks(checks)

// //////////////////////////////////////////////////////////////// Import Model
// -----------------------------------------------------------------------------
MC.model.Print = require('@Module_Print/model')
