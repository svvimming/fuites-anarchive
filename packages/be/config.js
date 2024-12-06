// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
const Path = require('path')

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
module.exports = {
  // ================================================= Server Config & Variables
  port: (function () {
    const env = process.env.SERVER_ENV
    let port = 3001 // development
    switch (env) {
      case 'stable': port = 3002; break
      case 'production': port = 3003; break
    } return port
  }()),
  repoRoot: Path.resolve(__dirname, '../../'),
  packageRoot: __dirname,
  staticRoot: Path.resolve(__dirname, 'static'),
  publicRoot: Path.resolve(__dirname, 'public'),
  tmpRoot: Path.resolve(__dirname, 'tmp'),
  frontendUrl: (function () {
    const env = process.env.SERVER_ENV
    let uri = 'https://localhost:2001'
    switch (env) {
      case 'stable': uri = 'https://stable.fuit.es'; break
      case 'production': uri = 'https://fuit.es'; break
    } return uri
  }()),
  backendUrl: (function () {
    const env = process.env.SERVER_ENV
    let uri = 'https://localhost:3001'
    switch (env) {
      case 'stable': uri = 'https://stable.fuit.es/api'; break
      case 'production': uri = 'https://fuit.es/api'; break
    } return uri
  }()),
  // ==================================================================== Server
  server: false,
  environment: process.env.SERVER_ENV,
  autocreateEntities: [
    { type: 'dir', path: 'static' },
    { type: 'dir', path: 'tmp' },
    { type: 'dir', path: 'tmp/uploads' },
    { type: 'dir', path: 'tmp/prints' },
    { type: 'dir', path: 'public' },
    { type: 'dir', path: 'public/uploads' },
    { type: 'dir', path: 'public/prints' }
  ],
  serveStaticDirectories: [
    '/public'
  ],
  // ================================================================== Database
  databaseUrl: process.env.DATABASE_URL_REFACTOR,
  databaseName: process.env.DATABASE_NAME_REFACTOR,
  mongoConnectionOptions: {
    // ssl: true,
    auth: {
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD
    }
  },
  mongooseConnection: false,
  model: {},
  excludeModules: [],
  // ================================================================= Socket.Io
  socket: {
    io: false,
    listeners: []
  },
  // ======================================================== Session Management
  expressSessionOptions: {
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: false,
    proxy: process.env.NODE_ENV !== 'development' ? true : undefined,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // Expires in 24hrs
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      unset: 'destroy'
    }
  },
  expressSession: false,
  // ====================================================================== CORS
  cors: {
    origin: [
      'https://localhost:2001'
    ],
    methods: 'OPTIONS,GET,POST',
    allowedHeaders: 'Origin,Accept,Authorization,X-Requested-With,Content-Type,Cache-Control',
    credentials: true,
    optionsSuccessStatus: 200
  },
  // =================================================================== Modules
  modules: {
    // ---------------------------------------------------------------- Uploader
    uploader: {
      chunkSize: 50000
    }
  }
}
