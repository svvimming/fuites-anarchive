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
    { type: 'dir', path: 'tmp/uploads/instance-fe' },
    { type: 'dir', path: 'tmp/uploads/interweave' },
    { type: 'dir', path: 'tmp/uploads/music' },
    { type: 'dir', path: 'tmp/uploads/blinkrate' },
    { type: 'dir', path: 'tmp/uploads/3e' },
    { type: 'dir', path: 'public' },
    { type: 'dir', path: 'public/uploads' },
    { type: 'dir', path: 'public/uploads/instance-fe' },
    { type: 'dir', path: 'public/uploads/interweave' },
    { type: 'dir', path: 'public/uploads/music' },
    { type: 'dir', path: 'public/uploads/blinkrate' },
    { type: 'dir', path: 'public/uploads/3e' }
  ],
  serveStaticDirectories: [
    '/public/uploads'
  ],
  // ================================================================== Database
  mongoInstances: {
    'instance-fe': {
      databaseUrl: process.env.DATABASE_URL_INSTANCE_FE,
      databaseName: process.env.DATABASE_NAME_INSTANCE_FE,
      mongoConnectionOptions: {
        // ssl: true,
        auth: {
          username: process.env.DATABASE_USER,
          password: process.env.DATABASE_PASSWORD
        }
      },
      mongooseConnection: false,
      model: {},
      excludeModules: []
    },
    interweave: {
      databaseUrl: process.env.DATABASE_URL_INTERWEAVE,
      databaseName: process.env.DATABASE_NAME_INTERWEAVE,
      mongoConnectionOptions: {
        // ssl: true,
        auth: {
          username: process.env.DATABASE_USER,
          password: process.env.DATABASE_PASSWORD
        }
      },
      mongooseConnection: false,
      model: {},
      excludeModules: []
    },
    music: {
      databaseUrl: process.env.DATABASE_URL_MUSIC,
      databaseName: process.env.DATABASE_NAME_MUSIC,
      mongoConnectionOptions: {
        // ssl: true,
        auth: {
          username: process.env.DATABASE_USER,
          password: process.env.DATABASE_PASSWORD
        }
      },
      mongooseConnection: false,
      model: {},
      excludeModules: []
    },
    blinkrate: {
      databaseUrl: process.env.DATABASE_URL_BLINKRATE,
      databaseName: process.env.DATABASE_NAME_BLINKRATE,
      mongoConnectionOptions: {
        // ssl: true,
        auth: {
          username: process.env.DATABASE_USER,
          password: process.env.DATABASE_PASSWORD
        }
      },
      mongooseConnection: false,
      model: {},
      excludeModules: []
    },
    '3e': {
      databaseUrl: process.env.DATABASE_URL_3E,
      databaseName: process.env.DATABASE_NAME_3E,
      mongoConnectionOptions: {
        // ssl: true,
        auth: {
          username: process.env.DATABASE_USER,
          password: process.env.DATABASE_PASSWORD
        }
      },
      mongooseConnection: false,
      model: {},
      excludeModules: []
    }
  },
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
  expressSession: {},
  // ====================================================================== CORS
  cors: {
    origin: [
      'https://localhost:2001',
      'https://localhost:2004',
      'https://localhost:2007',
      'https://localhost:2010',
      'https://localhost:2013',
      'https://interweave.fuit.es',
      'https://music.fuit.es',
      'https://blinkrate.fuit.es',
      'https://3e.fuit.es'
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
