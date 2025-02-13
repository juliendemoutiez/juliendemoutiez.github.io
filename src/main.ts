import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueTippy from 'vue-tippy'

import '@/assets/main.css'
import 'tippy.js/dist/tippy.css'

const app = createApp(App)

app.use(router)
app.use(VueTippy, {
  defaultProps: { placement: 'top' },
})

app.mount('#app')
