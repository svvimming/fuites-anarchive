// ///////////////////////////////////////////////////////////////////// Imports
// -----------------------------------------------------------------------------
import { defineNuxtConfig } from 'nuxt/config'
import Path from 'path'

// /////////////////////////////////////////////////////////// Variables & Setup
// -----------------------------------------------------------------------------
const env = process.env.SERVER_ENV

const baseUrls = {
  backend: process.env.DOMAIN__BACKEND,
  client: process.env.DOMAIN__CLIENT,
  websocket: process.env.DOMAIN__WEBSOCKET
}

// ////////////////////////////////////////////////////////////////////// Export
// -----------------------------------------------------------------------------
export default defineNuxtConfig({
  // =================================================================== General
  compatibilityDate: '2024-07-30',
  devtools: { enabled: false },
  site: {
    url: baseUrls.client
  },
  extends: [],
  // ===================================================== Runtime Configuration
  runtimeConfig: {
    public: {
      serverEnv: env,
      siteUrl: baseUrls.client,
      backendUrl: baseUrls.backend,
      websocketUrl: baseUrls.websocket,
      doSpacesBucketName: process.env.DO_SPACES_BUCKET_NAME,
      doSpacesEndpoint: process.env.DO_SPACES_ENDPOINT
    }
  },
  // ======================================================== Development Server
  devServer: {
    port: process.env.DOMAIN__CLIENT_PORT,
    host: 'localhost',
    https: {
      key: '../../localhost_key.pem',
      cert: '../../localhost_cert.pem'
    }
  },
  // ======================================================================= App
  app: {
    head: {
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'msapplication-config', content: '/favicon/browserconfig.xml' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon/favicon-96x96.png' },
        { rel: 'manifest', href: '/favicon/manifest.json' }
      ]
    }
  },
  // ================================================================== Compiler
  vite: {
    vue: {
      config: { silent: true },
      silent: true
    },
    css: {
      preprocessorOptions: {
        scss: { // make SCSS variables, functions and mixins globally accessible
          additionalData: `
            @use "sass:math";
            @import "@/assets/scss/variables.scss";
          `
        }
      }
    }
  },
  // ============================================================= Global Styles
  css: [
    '@/assets/scss/typography.scss',
    '@/assets/scss/main.scss'
  ],
  // =================================================================== Modules
  modules: [
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@nuxt/content',
    '@/modules/site.mjs'
  ],
  // ============================================================ [Module] Pinia
  pinia: {
    storesDirs: [
      './stores/**'
    ]
  },
  // ==================================================== [Module] @nuxt/content
  content: {
    watch: false,
    sources: {
      data: {
        driver: 'fs',
        prefix: '/data',
        base: Path.resolve(__dirname, 'data')
      }
    }
  }
})
