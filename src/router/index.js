import { createRouter, createWebHashHistory } from 'vue-router'
import ConformityMap from '@/views/ConformityMap.vue'
import PilotMap from '@/views/PilotMap.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/conformity-map',
      name: 'conformity-map',
      component: ConformityMap,
    },
    {
      path: '/pilot-map',
      name: 'pilot-map',
      component: PilotMap,
    },
  ],
})

export default router
