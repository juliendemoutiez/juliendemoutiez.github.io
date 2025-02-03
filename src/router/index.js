// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'
import MapPage from '../views/MapPage.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/map',
      name: 'map',
      component: MapPage
    }
  ]
})

export default router