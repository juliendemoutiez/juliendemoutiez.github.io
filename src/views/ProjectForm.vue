<template>
  <BaseForm title="Ajouter un projet" icon="📊" :toast="toast" :alert="duplicateAlert" :submit-disabled="isSubmitting"
    @submit="handleSubmit">
    <template #form-content v-if="formData">
      <div class="grid gap-y-8">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div class="col-span-1">
            <p class="form-header">Informations générales</p>
          </div>
          <div class="col-span-1 sm:col-span-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="col-span-1 sm:col-span-2">
                <label class="form-label" for="name">Nom du projet *</label>
                <input id="name" v-model="formData.name" type="text" placeholder="NEC 2025"
                  @input="debouncedFetchDuplicates" required />
              </div>
              <div class="col-span-1 sm:col-span-2">
                <label class="form-label" for="product">Produit *</label>
                <select id="product" v-model="formData.product" required>
                  <option disabled selected value>Sélectionner...</option>
                  <option v-for="(product, index) in formOptions.products" :key="index" :value="product.name"
                    :disabled="product.name === '----------'">
                    {{ product.name }}
                  </option>
                </select>
              </div>
              <div class="col-span-1 sm:col-span-2">
                <label class="form-label" for="type">Type *</label>
                <select id="type" v-model="formData.type" required>
                  <option disabled selected value>Sélectionner...</option>
                  <option v-for="(type, index) in formOptions.types" :key="index" :value="type.name">
                    {{ type.name }}
                  </option>
                </select>
              </div>
              <div class="col-span-1 sm:col-span-2">
                <label class="form-label" for="description">Description du projet *</label>
                <textarea id="description" class="flex-1" v-model="formData.description" type="text"
                  placeholder="Numérique En Commun" required></textarea>
              </div>
              <div class="col-span-1 sm:col-span-2">
                <label class="form-label" for="owners">Responsable(s) projet *</label>
                <MultiselectDropdown name="owners" v-model:selected="formData.owners" :fetchSuggestions="fetchOwners"
                  displayField="Nom_complet" :required="formData.owners.length == 0"
                  customValidity="Veuillez sélectionner au moins un(e) responsable projet" />
              </div>
            </div>
          </div>
          <div class="col-span-1">
            <p class="form-header">Dates du projet</p>
            <p class="form-subheader">A renseigner si vous souhaitez que le projet apparaisse dans la page "Calendrier"
            </p>
          </div>
          <div class="col-span-1 sm:col-span-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="col-span-1">
                <label class="form-label" for="start_date">Date de début</label>
                <input id="start_date" v-model="formData.start_date" type="date" />
              </div>
              <div class="col-span-1">
                <label class="form-label" for="end_date">Date de fin</label>
                <input id="end_date" v-model="formData.end_date" type="date" :min="formData.start_date" />
              </div>
            </div>
          </div>
          <div class="col-span-1">
            <p class="form-header">Formulaires</p>
            <p class="form-subheader">A renseigner pour les projets de type
              <span class="bg-slate-100 px-2 py-1 rounded-md text-slate-800"
                style="line-height: 2rem">📅&nbspEvénement</span> ou <span
                class="bg-slate-100 px-2 py-1 rounded-md text-slate-800"
                style="line-height: 2rem">🎤&nbspWebinaire</span>
            </p>
          </div>
          <div class="col-span-1 sm:col-span-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="col-span-1">
                <label class="form-label" for="sign_up_form_url">Formulaire d'inscription</label>
                <input id="sign_up_form_url" v-model="formData.sign_up_form_url" type="url"
                  placeholder="https://example.com/form" />
              </div>
              <div class="col-span-1">
                <label class="form-label" for="sign_up_form_edit_url">Edition du formulaire d'inscription</label>
                <input id="sign_up_form_edit_url" v-model="formData.sign_up_form_edit_url" type="url"
                  placeholder="https://example.com/form/edit" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </BaseForm>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { debounce } from 'lodash'
import { useGrist } from '@/composables/useGrist'
import { useToast } from '@/composables/useToast'
import BaseForm from '@/components/BaseForm.vue'
import MultiselectDropdown from '@/components/MultiselectDropdown.vue'
import { PROJECT_FORM_DATA } from '@/constants/index'
import { replaceAccents } from '@/utils/sqlUtils'
import { normalizeText } from '@/utils/textUtils'

// Constants
const QUERIES = {
  duplicate: (name) => {
    const nameField = 'Nom'
    const nameQuery = name ? `${replaceAccents(nameField)} = '${normalizeText(name)}'` : ''

    return `
      SELECT id, Nom
      FROM PROJETS
      WHERE ${nameQuery}
      LIMIT 1
    `;
  },
  suggestions: (terms) => {
    const tableName = 'UTILISATEURS';
    const nameField = 'Nom_complet';

    const whereConditions = terms.map(term =>
      `${replaceAccents(nameField)} LIKE '%' || '${normalizeText(term)}' || '%'`
    ).join(' AND ');

    return `
      SELECT id, ${nameField}
      FROM ${tableName}
      WHERE ${whereConditions}
      ORDER BY ${nameField}
      LIMIT 10
    `;
  }
};

// Refs
const duplicateFound = ref(null)
const formData = ref(null)
const currentUser = ref(null)
const isSubmitting = ref(false)
const formOptions = ref({
  products: [],
  types: [],
})

// Initialise composables
const { executeQuery, executeGetRequest, initializeGrist } = useGrist()
const { toast, showSuccess, showError } = useToast()

// Methods
const handleSubmit = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    const outputData = {
      'Nom': formData.value.name,
      'Description': formData.value.description,
      'Produit': formData.value.product,
      'Type': formData.value.type,
      'Date_de_debut': formData.value.start_date,
      'Date_de_fin': formData.value.end_date,
      'Formulaire_d_inscription': formData.value.sign_up_form_url,
      'Edition_du_formulaire_d_inscription': formData.value.sign_up_form_edit_url,
      'Responsable_s_projet': ['L'].concat(formData.value.owners.map(e => e.id)),
    }

    const actions = [['AddRecord', 'PROJETS', undefined, outputData]]
    await grist.docApi.applyUserActions(actions)

    initForm()
    showSuccess('Le projet a été créé avec succès.')
  } catch (error) {
    console.error(error)
    showError('Une erreur s\'est produite lors de la création du projet.')
  } finally {
    isSubmitting.value = false
  }
}

const initForm = () => {
  formData.value = JSON.parse(JSON.stringify(PROJECT_FORM_DATA))
  if (currentUser.value) {
    formData.value.owners = [currentUser.value]
    if (currentUser.value.Pages_privees.length === 1) {
      formData.value.product = currentUser.value.Pages_privees[0]
    }
  }
  duplicateFound.value = null
}

const fetchDuplicates = async () => {
  if (!formData.value.name) {
    duplicateFound.value = null
    return
  }
  try {
    const records = await executeQuery(QUERIES.duplicate(formData.value.name))
    if (!records.length) {
      duplicateFound.value = null
      return
    }
    duplicateFound.value = 'name'
  } catch (error) {
    console.error('Duplicate search error:', error)
    duplicateFound.value = null
  }
}

const getFormOptions = async () => {
  const tableColumnsSettings = await executeGetRequest('/tables/PROJETS/columns');
  try {
    [['Produit', 'products'], ['Type', 'types']].forEach(([columnName, key]) => {
      const widgetOptions = JSON.parse(tableColumnsSettings.columns.find(column => column.id === columnName).fields.widgetOptions);
      if (key === 'products') {
        const userProjects = currentUser.value.Pages_privees.split(',')
        const options = widgetOptions.choices.sort().map(choice => ({
          id: choice,
          name: choice
        }))
        formOptions.value[key] = [
          ...options.filter(option => userProjects.some(name => option.name.includes(name))).sort(),
          { id: '----------', name: '----------' },
          ...options.filter(option => !userProjects.some(name => option.name.includes(name))).sort(),
        ]
      } else {
        formOptions.value[key] = widgetOptions.choices.sort().map(choice => ({
          id: choice,
          name: choice
        }))
      }
    });
  } catch (error) {
    console.error('Error parsing form options:', error);
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

const fetchSuggestions = () => {
  return async (query) => {
    try {
      const records = await executeQuery(QUERIES.suggestions(query))
      return records.map(record => record.fields)
    } catch (error) {
      console.error('Search error:', error)
    }
  }
}

const fetchOwners = fetchSuggestions()
const debouncedFetchDuplicates = debounce(fetchDuplicates, 500)

// Computed
const duplicateAlert = computed(() => {
  if (!duplicateFound.value) return null
  return {
    title: 'Doublon',
    message: 'Un projet du même nom existe déjà'
  }
})

// Lifecycle hooks
onMounted(async () => {
  try {
    await initializeGrist()
    await getCurrentUser();
    await getFormOptions();
    await initForm()
  } catch (err) {
    console.error('Initialization error:', err)
  }
})

</script>