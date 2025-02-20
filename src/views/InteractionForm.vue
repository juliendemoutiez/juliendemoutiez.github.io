<template>
  <BaseForm title="Ajouter une interaction" icon="☎️" :alert="alert" :submit-disabled="isSubmitting"
    @submit="handleSubmit">
    <template #form-content v-if="formData">
      <div class="grid gap-y-8">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div class="col-span-1">
            <p class="form-header">Quand ?</p>
            <p class="form-subheader">Sélectionnez la date de l'interaction</p>
          </div>
          <div class="col-span-1 sm:col-span-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="col-span-1 sm:col-span-2">
                <label class="form-label" for="date">Date *</label>
                <input id="date" v-model="formData.date" type="date" required />
              </div>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div class="col-span-1">
            <p class="form-header">Qui ?</p>
            <p class="form-subheader">Renseignez le ou les contacts présents pendant l’échange. Les contacts doivent
              préalablement avoir été créés dans la table "Contacts"</p>
            <p class="form-subheader">Les contacts internes sont les membres de l’Incubateur ayant participé à l’échange
            </p>
          </div>
          <div class="col-span-1 sm:col-span-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="col-span-1 sm:col-span-2">
                <label class="form-label" for="contacts">Contact(s) *</label>
                <MultiselectDropdown id="contacts" v-model:selected="formData.contacts"
                  :fetchSuggestions="fetchContacts" displayField="Nom_Orga_Coll"
                  :required="formData.contacts.length === 0" />
              </div>
              <div class="col-span-1 sm:col-span-2">
                <label class="form-label" for="internalContacts">Contact(s) interne(s) *</label>
                <MultiselectDropdown id="internalContacts" v-model:selected="formData.internalContacts"
                  :fetchSuggestions="fetchInternalContacts" displayField="Nom_complet"
                  :required="formData.internalContacts.length === 0" />
              </div>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div class="col-span-1">
            <p class="form-header">Quoi ?</p>
            <p class="form-subheader">Sélectionnez le(s) type(s) d'interaction et le(s) projet(s) dans lequel celle-ci
              s'inscrit</p>
          </div>
          <div class="col-span-1 sm:col-span-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="col-span-1 sm:col-span-2">
                <label class="form-label" for="types">Type(s) *</label>
                <MultiselectDropdown id="types" v-model:selected="formData.types" :options="formOptions.types"
                  :required="formData.types.length === 0" />
              </div>
              <div class="col-span-1 sm:col-span-2">
                <label class="form-label" for="projects">Projet(s) *</label>
                <MultiselectDropdown id="projects" v-model:selected="formData.projects"
                  :fetchSuggestions="fetchProjects" displayField="Nom_complet"
                  :required="formData.projects.length === 0" />
              </div>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div class="col-span-1">
            <p class="form-header">Notes</p>
            <p class="form-subheader">Insérez ici vos notes de l’échange et/ou copiez-collez le lien vers le document
              pad/Docs de prise de notes</p>
          </div>
          <div class="col-span-1 sm:col-span-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="col-span-1 sm:col-span-2">
                <textarea id="notes" style="height: 200px" v-model="formData.notes" type="text"
                  placeholder="Notes..."></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </BaseForm>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGrist } from '@/composables/useGrist'
import { useAlert } from '@/composables/useAlert'
import BaseForm from '@/components/BaseForm.vue'
import MultiselectDropdown from '@/components/MultiselectDropdown.vue'
import { INTERACTION_FORM_DATA } from '@/constants/index'
import { replaceAccents } from '@/utils/sqlUtils'
import { normalizeText } from '@/utils/textUtils'

// Constants
const QUERIES = {
  suggestions: (type, terms) => {
    const tableName = {
      project: 'PROJETS',
      internalContact: 'UTILISATEURS',
      contact: 'CONTACTS'
    }[type];
    const selectedFields = {
      project: 'Nom_complet',
      internalContact: 'Nom_complet',
      contact: 'Nom_complet, Collectivites_et_organisations'
    }[type];

    const nameField = {
      project: 'Nom_complet',
      internalContact: 'Nom_complet',
      contact: 'Nom_complet'
    }[type];

    const whereConditions = terms.map(term =>
      `${replaceAccents(nameField)} LIKE '%' || '${normalizeText(term)}' || '%'`
    ).join(' AND ');

    return `
      SELECT id, ${selectedFields}
      FROM ${tableName}
      WHERE ${whereConditions}
      ORDER BY ${nameField}
      LIMIT 10
    `;
  }
};

// Refs
const currentUser = ref(null)
const formData = ref(null)
const isSubmitting = ref(false)
const formOptions = ref({
  types: [],
})

// Initialise composables
const { executeQuery, executeGetRequest, initializeGrist } = useGrist()
const { alert, showSuccess, showError } = useAlert()

// Methods
const handleSubmit = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    const outputData = {
      'Date': formData.value.date,
      'Projets': ['L'].concat(formData.value.projects.map(e => e.id)),
      'Type': ['L'].concat(formData.value.types),
      'Contacts': ['L'].concat(formData.value.contacts.map(e => e.id)),
      'Contact_s_interne_s_': ['L'].concat(formData.value.internalContacts.map(e => e.id)),
      'Notes': formData.value.notes,
    }

    const actions = [['AddRecord', 'INTERACTIONS', undefined, outputData]]
    await grist.docApi.applyUserActions(actions)

    initForm()
    showSuccess('L\interaction a été créée avec succès.')
  } catch (error) {
    console.error(error)
    showError('Une erreur s\'est produite lors de la création de l\'interaction.')
  } finally {
    isSubmitting.value = false
  }
}

const initForm = () => {
  formData.value = JSON.parse(JSON.stringify(INTERACTION_FORM_DATA))
  if (currentUser.value) {
    formData.value.internalContacts = [currentUser.value]
  }
}

const getCurrentUser = async () => {
  try {
    const users = await grist.docApi.fetchTable('UTILISATEURS_summary_Email_Nom_complet')
    currentUser.value = {
      id: users.ID_UTILISATEUR[0][1],
      Nom_complet: users.Nom_complet[0],
      Pages_privees: users.Pages_privees[0]
    }
  } catch (error) {
    currentUser.value = null
    console.error('Current user error:', error)
  }
}

const retrieveFormOptions = async () => {
  const tableColumnsSettings = await executeGetRequest('/tables/INTERACTIONS/columns');
  try {
    [['Type', 'types']].forEach(([columnName, key]) => {
      const widgetOptions = JSON.parse(tableColumnsSettings.columns.find(column => column.id === columnName).fields.widgetOptions);
      formOptions.value[key] = widgetOptions.choices.sort();
    });
  } catch (error) {
    console.error('Error parsing form options:', error);
  }
}

const fetchSuggestions = (type) => {
  return async (query) => {
    try {
      let records = await executeQuery(QUERIES.suggestions(type, query))
      if (type === 'project') {
        const userProjects = currentUser.value.Pages_privees.split(',')
        records = [
          ...records.filter(record => userProjects.some(name => record.fields.Nom_complet.includes(name))).sort(),
          ...records.filter(record => !userProjects.some(name => record.fields.Nom_complet.includes(name))).sort()
        ]
      }
      return records.map(record => {
        const additionalInfo = {}
        if (type === 'contact') {
          additionalInfo.Nom_Orga_Coll = record.fields.Nom_complet + (record.fields.Collectivites_et_organisations ? ` (${record.fields.Collectivites_et_organisations})` : '')
        }
        return {
          ...record.fields,
          ...additionalInfo
        }
      })
    } catch (error) {
      console.error('Search error:', error)
    }
  }
}
const fetchProjects = fetchSuggestions('project')
const fetchContacts = fetchSuggestions('contact')
const fetchInternalContacts = fetchSuggestions('internalContact')

// Lifecycle hooks
onMounted(async () => {
  try {
    await initializeGrist()
    await retrieveFormOptions();
    await getCurrentUser();
    await initForm()
  } catch (err) {
    console.error('Initialization error:', err)
  }
})

</script>