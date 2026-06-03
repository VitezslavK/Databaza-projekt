export default defineNuxtConfig({
  // Enable Nuxt 4 compatibility mode (srcDir → app/, new data-fetching defaults)
  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2024-11-01',

  devtools: { enabled: true },

  modules: [
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
  ],

  components: [
    { path: '~/components', pathPrefix: false },
  ],

  // We handle auth redirects ourselves via middleware
  supabase: {
    redirect: false,
  },

  css: ['~/assets/css/main.css'],

  // Tailwind config is auto-detected from tailwind.config.ts
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },
})
