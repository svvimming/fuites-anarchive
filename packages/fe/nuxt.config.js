export default {
  // ///////////////////////////////////////////////////// Runtime Configuration
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------- [Runtime] Public
  publicRuntimeConfig: {
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
    serverFlag: process.env.SERVER_ENV,
    socketOptions: {
      withCredentials: true
    }
  },
  // --------------------------------------------------------- [Runtime] Private
  privateRuntimeConfig: {},
  // /////////////////////////////////////////////////////////// Server & Render
  // ---------------------------------------------------------------------------
  server: {
    port: (function () {
      const env = process.env.SERVER_ENV
      let port = 2001 // development
      switch (env) {
        case 'stable': port = 2002; break
        case 'production': port = 2003; break
      } return port
    }()),
    host: process.env.NODE_ENV !== 'development' ? '0.0.0.0' : 'localhost'
  },
  // /////////////////////////////////////////////////////////// Global CSS/SCSS
  // ---------------------------------------------------------------------------
  css: [
    '~/assets/scss/main.scss'
  ],
  styleResources: {
    scss: [
      '~/assets/scss/variables.scss'
    ]
  },
  // /////////////////////////////////////////////////////////////////// Modules
  // ---------------------------------------------------------------------------
  modules: [
    '@nuxtjs/style-resources',
    '@nuxtjs/axios', // Doc: https://axios.nuxtjs.org/usage
    'nuxt-socket-io', // Doc: https://nuxt-socket-io.netlify.app/
    '~/modules/https',
    '~/modules/pocket',
    '~/modules/compost',
    '~/modules/toaster'
  ],
  // /////////////////////////////////////////////////////////////////// Plugins
  // ---------------------------------------------------------------------------
  plugins: [
    '~/plugins/axios-auth',
    '~/plugins/helpers',
    '~/plugins/directives',
    '~/plugins/scroll-to'
  ],
  // /////////////////////////////////////////////////// [Module] Nuxt Socket.io
  // ---------------------------------- Doc: https://nuxt-socket-io.netlify.app/
  io: {
    sockets: [{
      url: (function () {
        const env = process.env.SERVER_ENV
        let uri = 'https://localhost:3001' // development
        switch (env) {
          case 'stable': uri = 'https://stable.fuit.es'; break
          case 'production': uri = 'https://fuit.es'; break
        } return uri
      }())
    }]
  },
  // ////////////////////////////////////////////////////////// [Plugin] Toaster
  // ---------------------------------------------------------------------------
  toaster: {
    display: 10,
    timeout: 5000
  },
  // /////////////////////////////////////////////////////// Build configuration
  // ------------------------------------------------ Extend webpack config here
  build: {
    // -------------------------------------------------------------- Extensions
    extend (config, ctx) {
      config.module.rules.push(
        {
          test: /\.(frag|vert|glsl)$/,
          use: [
            {
              loader: 'glsl-shader-loader',
              options: {}
            }
          ]
        }
      )
    }
  }
}
