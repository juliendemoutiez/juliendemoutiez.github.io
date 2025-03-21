<template>
  <BaseModal :show="show" @close="emit('close')" title="Sélectionnez un événement">
    <template #modal-content>
      <div class="flex flex-1 flex-col">
        <div class="flex flex-col flex-1">
          <MultiselectDropdown id="project-name" :fetchSuggestions="fetchProjects" v-model:selected="selectedProjects"
            :onSelect="setDisplayedProject" displayField="Nom_Complet" placeholder="Rechercher un événement..."
            :showSelection="false" />
          <div class="flex flex-1 flex-col gap-4 py-4">
            <div class="flex flex-col gap-2" v-if="displayedProject">
              <div class="flex flex-col gap-2 border border-slate-100 rounded-lg p-4">
                <p class="font-semibold text-slate-800">{{ displayedProject.Nom_Complet }}</p>
                <p v-if="displayedProject.Date_de_debut" class="text-slate-500">{{
                  [formatDate(displayedProject.Date_de_debut),
                  formatDate(displayedProject.Date_de_fin)]
                    .filter(Boolean)
                    .join(' - ')
                }}</p>
              </div>
            </div>
          </div>
          <div class="flex flex-row gap-4 justify-end">
            <button type="button"
              class="items-center flex-1 px-4 py-2 bg-slate-200 border border-transparent rounded-md font-semibold text-slate-800 hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50"
              @click="emit('close')">
              Annuler
            </button>
            <button type="button"
              class="items-center flex-1 px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              @click="validate">
              Valider
            </button>
          </div>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import MultiselectDropdown from '@/components/MultiselectDropdown.vue'
import { formatDate } from '@/utils/dateFormat'
defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  fetchProjects: {
    type: Function,
    required: true,
  },
})

const emit = defineEmits(['update:selected', 'close'])

const selectedProjects = ref([])
const displayedProject = ref(null)

const setDisplayedProject = (project) => {
  displayedProject.value = project
}

const validate = () => {
  emit('update:selected', {
    id: displayedProject.value.id,
    name: displayedProject.value.Nom_Complet,
  })
  emit('close')
}

</script>
