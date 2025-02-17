<template>
  <BaseForm title="Ajouter une organisation" icon="🏛️" :alert="alert" :warning="duplicateMessage"
    :submit-disabled="isSubmitting || duplicateFound === 'name'" @submit="handleSubmit">
    <template #form-content v-if="formData">
      <div class="grid gap-y-8">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div class="col-span-1">
            <p class="form-header">Informations générales</p>
          </div>
          <div class="col-span-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="form-label" for="name">Nom *</label>
                <p class="form-sublabel"></p>
                <input id="name" v-model="formData.name" type="text" placeholder="Eure Normandie Numérique"
                  @input="debouncedFetchDuplicates" required />
              </div>
              <div class="col-span-2">
                <label class="form-label" for="acronym">Sigle</label>
                <input id="acronym" v-model="formData.acronym" type="text" placeholder="ENN" />
              </div>
              <div class="col-span-2">
                <label class="form-label" for="typologies">Typologie *</label>
                <MultiselectDropdown id="typologies" v-model:selected="formData.typologies"
                  :options="formOptions.typologies" :required="formData.typologies.length === 0"
                  customValidity="Veuillez sélectionner au moins une typologie" />
              </div>
              <div class="col-span-2">
                <label class="form-label" for="statuses">Statut juridique *</label>
                <MultiselectDropdown id="statuses" v-model:selected="formData.legalStatuses"
                  :options="formOptions.statuses" :required="formData.legalStatuses.length === 0"
                  customValidity="Veuillez sélectionner au moins un statut juridique" />
              </div>
              <div class="col-span-2">
                <label class="form-label" for="website">Site web *</label>
                <input id="website" v-model="formData.website" placeholder="https://www.eurenormandienumerique.fr/"
                  type="url" required />
              </div>
            </div>
          </div>
          <div class="col-span-1">
            <p class="form-header">Couverture</p>
            <p class="form-subheader">Quelle est le périmètre géographique de la structure ? (Préfecture, Centre de
              Gestion...)</p>
            <p class="form-subheader">Pour un OPSN : de quel(s) département(s) est/sont issues les collectivités
              adhérentes à cet OPSN ?</p>
          </div>
          <div class="col-span-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="form-label" for="communities">Collectivités
                  <Info class="inline-block size-3" v-tippy="{
                    content: 'Quelle est le périmètre géographique de la structure ? (Préfecture, Centre de Gestion...). Pour un OPSN : de quel(s) département(s) est/sont issues les collectivités adhérentes à cet OPSN ?',
                    arrow: true,
                    theme: 'dark'
                  }" />
                </label>
                <MultiselectDropdown name="communities" v-model:selected="formData.communities"
                  :fetchSuggestions="fetchCommunities" displayField="Libelle_et_departement" :required="false" />
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
import { Info } from 'lucide-vue-next'
import { useGrist } from '@/composables/useGrist'
import { useAlert } from '@/composables/useAlert'
import BaseForm from '@/components/BaseForm.vue'
import MultiselectDropdown from '@/components/MultiselectDropdown.vue'
import { ORGANISATION_FORM_DATA } from '@/constants/index'
import { replaceAccents } from '@/utils/sqlUtils'
import { normalizeText } from '@/utils/textUtils'

// Constants
const QUERIES = {
  duplicate: (name) => {
    const nameField = 'Nom'
    const nameQuery = name ? `${replaceAccents(nameField)} = '${normalizeText(name)}'` : ''

    return `
      SELECT id, Nom
      FROM ORGANISATIONS
      WHERE ${nameQuery}
      LIMIT 1
    `;
  },
  suggestions: (terms) => {
    const tableName = 'COLLECTIVITES';
    const nameField = 'Libelle_et_departement';

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
  },
};

// Refs
const duplicateFound = ref(null)
const formData = ref(null)
const isSubmitting = ref(false)
const formOptions = ref({
  statuses: [],
  typologies: [],
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
      'Nom': formData.value.name,
      'Typologie': ['L'].concat(formData.value.typologies),
      'Sigle': formData.value.acronym,
      'Statut_juridique': ['L'].concat(formData.value.legalStatuses),
      'Site_web': formData.value.website.toLowerCase(),
      'Couverture': ['L'].concat(formData.value.communities.map(e => e.id)),
    }

    const actions = [['AddRecord', 'ORGANISATIONS', undefined, outputData]]
    await grist.docApi.applyUserActions(actions)

    initForm()
    showSuccess('L\'organisation a été créé avec succès.')
  } catch (error) {
    console.error(error)
    showError('Une erreur s\'est produite lors de la création de l\'organisation.')
  } finally {
    isSubmitting.value = false
  }
}

const initForm = () => {
  formData.value = JSON.parse(JSON.stringify(ORGANISATION_FORM_DATA))
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

const retrieveFormOptions = async () => {
  const tableColumnsSettings = await executeGetRequest('/tables/ORGANISATIONS/columns');
  try {
    [['Typologie', 'typologies'], ['Statut_juridique', 'statuses']].forEach(([columnName, key]) => {
      const widgetOptions = JSON.parse(tableColumnsSettings.columns.find(column => column.id === columnName).fields.widgetOptions);
      formOptions.value[key] = widgetOptions.choices.sort();
    });
  } catch (error) {
    console.error('Error parsing form options:', error);
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

const fetchCommunities = fetchSuggestions()
const debouncedFetchDuplicates = debounce(fetchDuplicates, 500)

// Computed
const duplicateMessage = computed(() => {
  if (!duplicateFound.value) return null
  return {
    title: 'Doublon',
    message: 'Une organisation du même nom existe déjà'
  }
})

// Lifecycle hooks
onMounted(async () => {
  try {
    await initializeGrist()
    await retrieveFormOptions();
    await initForm()
  } catch (err) {
    console.error('Initialization error:', err)
  }
})

</script>