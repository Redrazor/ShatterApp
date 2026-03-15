import { createApp } from 'vue'
import { createHead } from '@vueuse/head'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import router from './router/index.ts'
import App from './App.vue'
import './style.css'
import './assets/print.css'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const head = createHead()

const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(head)
app.mount('#app')
