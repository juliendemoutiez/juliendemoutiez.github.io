import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueTippy from 'vue-tippy'
// import '@gouvfr/dsfr/dist/dsfr.min.css'
// import '@gouvminint/vue-dsfr/styles'
// import VueDsfr from '@gouvminint/vue-dsfr'

import '@/assets/main.css'
import 'tippy.js/dist/tippy.css'

const app = createApp(App)
  .use(router)
  // .use(VueDsfr)
  .use(VueTippy, {
    defaultProps: { placement: 'top' },
  })

app.mount('#app')
