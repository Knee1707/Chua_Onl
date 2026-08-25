// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },

  modules: ['@nuxtjs/tailwindcss'],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Đi Chùa Online · Viếng chùa, cầu an, thắp hương trực tuyến',
      htmlAttrs: { lang: 'vi' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'Trải nghiệm viếng chùa online: thắp nhang, rung chuông, cầu an, xin xăm trong không gian thiền tịnh.'
        }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Noto+Serif:wght@400;500;600&family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap'
        }
      ]
    },
    // Chuyển trang êm dịu, phù hợp không khí trang nghiêm
    pageTransition: { name: 'page-fade', mode: 'out-in' }
  },

  // Khóa Supabase (public). Để trống -> app tự chạy chế độ lưu local.
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
    }
  }
})
