export default {
  // ///////////////////////////////////////////////////// Runtime Configuration
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------- [Runtime] Public
  publicRuntimeConfig: {
    frontendUrl: (function () {
      const env = process.env.SERVER_ENV
      let uri = 'https://localhost:2013'
      switch (env) {
        case 'stable': uri = 'https://3e-stable.fuit.es'; break
        case 'production': uri = 'https://3e.fuit.es'; break
      } return uri
    }()),
    backendUrl: (function () {
      const env = process.env.SERVER_ENV
      let uri = 'https://localhost:3001'
      switch (env) {
        case 'stable': uri = 'https://3e-stable.fuit.es/api'; break
        case 'production': uri = 'https://3e.fuit.es/api'; break
      } return uri
    }()),
    serverFlag: process.env.SERVER_ENV,
    socketOptions: {
      withCredentials: true,
      channel: '3e'
    },
    mongoInstance: '3e'
  },
  // --------------------------------------------------------- [Runtime] Private
  privateRuntimeConfig: {},
  // /////////////////////////////////////////////////////////// Server & Render
  // ---------------------------------------------------------------------------
  server: {
    port: (function () {
      const env = process.env.SERVER_ENV
      let port = 2013 // development
      switch (env) {
        case 'stable': port = 2014; break
        case 'production': port = 2015; break
      } return port
    }()),
    host: process.env.NODE_ENV !== 'development' ? '0.0.0.0' : 'localhost'
  },
  // /////////////////////////////////////////////////////// Headers of the Page
  // ---------------------------------------------------------------------------
  head: {
    title: 'f u i t e s',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'msapplication-TileColor', content: '#ffffff' },
      { name: 'msapplication-TileImage', content: '/favicon/ms-icon-144x144.png' },
      { name: 'theme-color', content: '#ffffff' }
    ],
    link: [
      { rel: 'apple-touch-icon', sizes: '57x57', href: '/favicon/apple-icon-57x57.png' },
      { rel: 'apple-touch-icon', sizes: '60x60', href: '/favicon/apple-icon-60x60.png' },
      { rel: 'apple-touch-icon', sizes: '72x72', href: '/favicon/apple-icon-72x72.png' },
      { rel: 'apple-touch-icon', sizes: '76x76', href: '/favicon/apple-icon-76x76.png' },
      { rel: 'apple-touch-icon', sizes: '114x114', href: '/favicon/apple-icon-114x114.png' },
      { rel: 'apple-touch-icon', sizes: '120x120', href: '/favicon/apple-icon-120x120.png' },
      { rel: 'apple-touch-icon', sizes: '144x144', href: '/favicon/apple-icon-144x144.png' },
      { rel: 'apple-touch-icon', sizes: '152x152', href: '/favicon/apple-icon-152x152.png' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon/apple-icon-180x180.png' },
      { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/favicon/android-icon-192x192.png' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon/favicon-96x96.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon/favicon-16x16.png' },
      { rel: 'manifest', href: '/favicon/manifest.json' }
    ]
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
    '~/modules/toaster',
    '~/modules/mixer'
  ],
  // /////////////////////////////////////////////////////////////////// Plugins
  // ---------------------------------------------------------------------------
  plugins: [
    '~/plugins/axios-auth',
    '~/plugins/helpers',
    '~/plugins/directives',
    '~/plugins/scroll-to',
    '~/plugins/simplify-svg-path',
    '~/plugins/nuxt-hammer.js',
    '~/plugins/sharpen-canvas'
  ],
  // /////////////////////////////////////////////////// [Module] Nuxt Socket.io
  // ---------------------------------- Doc: https://nuxt-socket-io.netlify.app/
  io: {
    sockets: [{
      url: (function () {
        const env = process.env.SERVER_ENV
        let uri = 'https://localhost:3001/' // development
        switch (env) {
          case 'stable': uri = 'https://stable.fuit.es/'; break
          case 'production': uri = 'https://fuit.es/'; break
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
    transpile: [({ isLegacy }) => isLegacy && 'axios'],
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
