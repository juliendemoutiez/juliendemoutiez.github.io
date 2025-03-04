import { createRouter, createWebHashHistory } from 'vue-router'
import ConformityMap from '@/views/ConformityMap.vue'
import PilotMap from '@/views/PilotMap.vue'
import ContactForm from '@/views/ContactForm.vue'
import OrganisationForm from '@/views/OrganisationForm.vue'
import ProjectForm from '@/views/ProjectForm.vue'
import InteractionForm from '@/views/InteractionForm.vue'
import EventForm from '@/views/EventForm.vue'

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
    {
      path: '/contact-form',
      name: 'contact-form',
      component: ContactForm,
    },
    {
      path: '/organisation-form',
      name: 'organisation-form',
      component: OrganisationForm,
    },
    {
      path: '/project-form',
      name: 'project-form',
      component: ProjectForm,
    },
    {
      path: '/interaction-form',
      name: 'interaction-form',
      component: InteractionForm,
    },
    {
      path: '/event-form',
      name: 'event-form',
      component: EventForm,
    },
  ],
})

export default router
