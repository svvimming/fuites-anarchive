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
      websocketUrl: baseUrls.websocket
      // serverFlag: process.env.SERVER_ENV,
      // socketOptions: {
      //   withCredentials: true
      // }
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
        { name: 'msapplication-config', content: '/favicon/light/browserconfig.xml' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon/light/favicon-96x96.png' },
        { rel: 'manifest', href: '/favicon/light/manifest.json' }
      ]
    }
  },
  // ================================================================== Compiler
  vite: {
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
    '@/assets/scss/main.scss'
  ],
  // =================================================================== Modules
  modules: [
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@nuxt/content',
    '@/modules/websocket'
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
    markdown: {
      toc: {
        depth: 2,
        searcthDepth: 2
      }
    },
    sources: {
      data: {
        driver: 'fs',
        prefix: '/data',
        base: Path.resolve(__dirname, 'data')
      }
    }
  }
})
