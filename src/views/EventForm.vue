<template>
  <BaseForm v-if="formData" :title="`Echange événement - ${currentProject.name}`" icon="🧑" :toast="toast"
    :submit-disabled="isSubmitting" @submit="handleSubmit">
    <template #form-content v-if="formData">
      <div class="grid gap-y-8">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div class="col-span-1">
            <p class="form-header">Coordonnées</p>
          </div>
          <div class="col-span-1 sm:col-span-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="col-span-1">
                <label class="form-label" for="email">Email *</label>
                <input v-model="formData.email" type="email" id="email" placeholder="jean@dupont.fr" required @input="() => {
                  formData.email = formData.email.toLowerCase()
                  debouncedFetchExistingContact()
                }" />
              </div>
              <div class="col-span-1 sm:col-span-2" v-if="existingContact">
                <Alert :alert="existingContactAlert" />
              </div>
              <div class="col-span-1 col-start-1">
                <label class="form-label" for="firstName">Prénom *</label>
                <input id="firstName" v-model="formData.firstName" type="text" placeholder="Jean"
                  :required="!existingContact" :disabled="existingContact" />
              </div>
              <div class="col-span-1">
                <label class="form-label" for="lastName">Nom *</label>
                <input id="lastName" v-model="formData.lastName" type="text" placeholder="DUPONT" required
                  :disabled="existingContact" @input="formData.lastName = formData.lastName.toUpperCase()" />
              </div>
              <div class="col-span-1">
                <label class="form-label" for="phone">Téléphone</label>
                <div class="flex">
                  <select class="w-24 mr-2" v-model="formData.phone_indicator" id="phone_indicator"
                    :disabled="existingContact">
                    <option v-for="(indicator, index) of PHONE_INDICATORS" :key="index" :value="indicator.value">{{
                      indicator.value
                    }}</option>
                  </select>
                  <input v-model="formData.phone" type="tel"
                    :pattern="formData.phone_indicator.length === 3 ? PHONE_PATTERNS.metropolitan.pattern : PHONE_PATTERNS.overseas.pattern"
                    id="phone"
                    :placeholder="formData.phone_indicator.length === 3 ? PHONE_PATTERNS.metropolitan.placeholder : PHONE_PATTERNS.overseas.placeholder"
                    @input="handlePhoneFormat($event, 'phone')" :disabled="existingContact" />
                </div>
              </div>
            </div>
          </div>
          <div class="col-span-1">
            <p class="form-header">Informations professionnelles</p>
            <p class="form-subheader">Ces champs sont optionnels</p>
          </div>
          <div class="col-span-1 sm:col-span-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="col-span-1 sm:col-span-2">
                <label class="form-label" for="position">Fonction</label>
                <input v-model="formData.position" type="text" id="position" placeholder="Maire"
                  :disabled="existingContact" />
              </div>
              <div class="col-span-1">
                <label class="form-label" for="communities">Collectivités</label>
                <MultiselectDropdown id="communities" v-model:selected="formData.communities"
                  :fetchSuggestions="fetchCommunities" displayField="Libelle_et_departement" :required="false"
                  customValidity="Veuillez sélectionner une collectivité ou une organisation"
                  :disabled="existingContact" />
              </div>
              <div class="col-span-1">
                <label class="form-label" for="organisations">Organisations</label>
                <MultiselectDropdown id="organisations" v-model:selected="formData.organisations"
                  :fetchSuggestions="fetchOrganisations" displayField="Nom_sigle" :required="false" :allow-new="true"
                  :disabled="existingContact" />
              </div>
            </div>
          </div>
          <div class="col-span-1">
            <p class="form-header">Détails de l'échange</p>
          </div>
          <div class="col-span-1 sm:col-span-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="col-span-1 sm:col-span-2">
                <label class="form-label" for="subject">Sujet de l'échange *</label>
                <select id="subject" v-model="formData.subject" required>
                  <option disabled selected value>Sélectionner...</option>
                  <option v-for="(subject, index) of formOptions.subjects" :key="index" :value="subject">{{ subject }}
                  </option>
                </select>
                <input class="mt-4" v-if="formData.subject === 'Autre'" v-model="formData.subject_other" type="text"
                  id="subject_other" placeholder="Précisez le sujet" required />
              </div>
              <div class="col-span-1 sm:col-span-2" :class="{ 'mb-4': formData.products_interested.length > 0 }">
                <label class="form-label" for="products">Produit(s) de l'Incubateur qui intéresse(nt) le
                  prospect</label>
                <MultiselectDropdown id="products" v-model:selected="formData.products_interested"
                  :options="formOptions.products" :onSelect="onSelectProduct" displayField="name">
                  <template #selected-item="{ item, index }">
                    <div
                      class="flex items-center justify-between flex-1 flex-row px-6 py-2 gap-2 w-full bg-gray-100 rounded-md min-w-full">
                      <div class="flex flex-row items-center gap-2 flex-wrap w-full">
                        <p class="text-sm font-semibold flex-1 text-ellipsis">{{ item.name }}</p>
                        <button type="button" class="flex items-center gap-2 px-4 py-2 bg-white rounded-md"
                          @click="handleProductUsage(item)">
                          <span class="flex items-center gap-2 text-sm font-semibold" v-if="item.already_used">
                            <CheckCircle class="w-3.5 h-3.5 m-0.5 text-green-500" />
                            Déjà utilisé
                          </span>
                          <span class="flex items-center gap-2 text-sm font-semibold" v-else>
                            <X class="w-3.5 h-3.5 m-0.5 text-red-500" />
                            Pas encore utilisé
                          </span>
                        </button>
                      </div>
                      <button type="button" @click="handleRemoveProduct(index)"
                        class="rounded-full bg-blue-200 text-blue-700 transition hover:bg-blue-300 ml-2">
                        <X class="w-3.5 h-3.5 m-0.5" />
                      </button>
                    </div>
                  </template>
                </MultiselectDropdown>
              </div>
              <div class="col-span-1 sm:col-span-2">
                <label class="form-label" for="notes">Notes</label>
                <textarea class="h-24" id="notes" v-model="formData.notes" placeholder="Notes" />
              </div>
            </div>
          </div>
        </div>
        <div class="border-t py-8">
          <p class="text-slate-500 mb-4">Pour sélectionner un autre événement, cliquez sur le bouton ci-dessous.
          </p>
          <button
            class="inline-flex items-center px-4 py-2 bg-slate-200 border border-transparent rounded-md font-semibold text-slate-800 hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            @click="showProjectSelectionModal = true" type="button">
            <Repeat2 class="w-4 h-4 mr-2" />
            Changer d'événement
          </button>
        </div>
      </div>
    </template>
  </BaseForm>
  <ProjectSelectionModal :show="showProjectSelectionModal" @close="showProjectSelectionModal = false"
    :fetchProjects="fetchProjects" @update:selected="currentProject = $event" />
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { CheckCircle, X, Repeat2 } from 'lucide-vue-next'
import { debounce } from 'lodash'

import { useGrist } from '@/composables/useGrist'
import { useToast } from '@/composables/useToast'
import BaseForm from '@/components/BaseForm.vue'
import Alert from '@/components/Alert.vue'
import MultiselectDropdown from '@/components/MultiselectDropdown.vue'
import ProjectSelectionModal from '@/components/ProjectSelectionModal.vue'
import {
  PHONE_INDICATORS,
  PHONE_PATTERNS,
  EVENT_FORM_DATA,
} from '@/constants/index'
import { formatPhoneNumber } from '@/utils/phoneFormat'
import { replaceAccents } from '@/utils/sqlUtils'
import { normalizeText } from '@/utils/textUtils'

// Constants
const QUERIES = {
  existingContact: (email) => {
    const emailQuery = email ? `LOWER(Email) = LOWER('${email}')` : ''
    return `
      SELECT id, Prenom, Nom, Fonction, Telephone, Collectivites, Organisations,
        (SELECT GROUP_CONCAT(Nom_sigle, ', ') FROM ORGANISATIONS WHERE id IN (SELECT json_each.value FROM json_each(Organisations))) as Organisation_noms,
        (SELECT GROUP_CONCAT(Libelle_et_departement, ', ') FROM COLLECTIVITES WHERE id IN (SELECT json_each.value FROM json_each(Collectivites))) as Collectivites_noms
      FROM CONTACTS
      WHERE ${emailQuery}
      LIMIT 1
    `
  },
  suggestions: (type, terms) => {
    const tableName = {
      community: 'COLLECTIVITES',
      organisation: 'ORGANISATIONS',
      project: 'PROJETS'
    }[type]
    const nameField = {
      community: 'Libelle_et_departement',
      organisation: 'Nom_sigle',
      project: 'Nom_Complet'
    }[type]
    let whereConditions = terms.map(term =>
      `${replaceAccents(nameField)} LIKE '%' || '${normalizeText(term)}' || '%'`
    ).join(' AND ');

    let additionalFields = ''

    if (type === 'project') {
      whereConditions = whereConditions + ' AND Type = "📅 Evénement"'
      additionalFields = ['Date_de_debut', 'Date_de_fin']
    }

    return `
      SELECT id, ${[nameField, ...additionalFields].join(', ')}
      FROM ${tableName}
      WHERE ${whereConditions}
      ORDER BY ${nameField}
      LIMIT 10
    `
  }
}

// Refs
const formData = ref(null)
const isSubmitting = ref(false)
const existingContact = ref(null)
const currentProject = ref(null)
const formOptions = ref({
  products: [],
  subjects: [
    'SAV sur un produit',
    'Intérêt pour une démonstration',
    'Demande d’information',
    'Besoin d’être recontacté',
    'Autre'
  ]
})
const currentUser = ref(null)
const showProjectSelectionModal = ref(false)
// Initialise composables
const { executeQuery, executeGetRequest, initializeGrist, createRecords } = useGrist()
const { toast, showSuccess, showError } = useToast()

// Methods
const handlePhoneFormat = (_event, key) => {
  const indicator = formData.value[`${key}_indicator`]
  formData.value[key] = formatPhoneNumber(formData.value[key], indicator)
}

const handleSubmit = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    let contactId
    if (existingContact.value) {
      contactId = existingContact.value.fields.id
    } else {
      const newOrganisationNames = formData.value.organisations.filter(organisation => organisation.is_new).map(organisation => organisation.Nom_sigle)
      const newOrganisationIds = await createOrganisations(newOrganisationNames)
      contactId = await createContact(newOrganisationIds)
    }
    await createInteraction(contactId)
    initForm()
    showSuccess('L\'interaction a été enregistrée avec succès.')
  } catch (error) {
    console.error(error);
    showError('Une erreur s\'est produite lors de l\'enregistrement de l\'interaction.')
  } finally {
    isSubmitting.value = false
  }
}

const initForm = () => {
  existingContact.value = null
  formData.value = JSON.parse(JSON.stringify(EVENT_FORM_DATA))
}

const retrieveFormOptions = async () => {
  const tableColumnsSettings = await executeGetRequest('/tables/PROJETS/columns');
  try {
    [['Produit', 'products']].forEach(([columnName, key]) => {
      const widgetOptions = JSON.parse(tableColumnsSettings.columns.find(column => column.id === columnName).fields.widgetOptions);
      formOptions.value[key] = widgetOptions.choices.sort().map(choice => ({
        id: choice,
        name: choice
      }))
    });
  } catch (error) {
    console.error('Error parsing form options:', error);
  }
}

const onSelectProduct = (item) => {
  formData.value.products_interested.push({
    ...item,
    already_used: false
  })
}

const handleProductUsage = (item) => {
  item.already_used = !item.already_used
}

const handleRemoveProduct = (index) => {
  formData.value.products_interested = formData.value.products_interested.filter((_, i) => i !== index)
}

const fetchExistingContact = async () => {
  if (!formData.value.email) {
    existingContact.value = null
    resetContact()
  }
  try {
    const records = await executeQuery(QUERIES.existingContact(formData.value.email))
    if (!records.length) {
      existingContact.value = null
      resetContact()
      return
    }
    existingContact.value = records[0]
    let phone_indicator
    let phone
    let communities
    let organisations
    try {
      phone_indicator = records[0].fields.Telephone.split(' ')[0]
      phone = records[0].fields.Telephone.split(' ').slice(1).join(' ')
    } catch {
      phone_indicator = '+33'
      phone = ''
    }
    try {
      communities = (records[0].fields.Collectivites_noms || '').split(',').filter(Boolean).map(name => ({
        id: name,
        Libelle_et_departement: name
      }))
      organisations = (records[0].fields.Organisation_noms || '').split(',').filter(Boolean).map(name => ({
        id: name,
        Nom_sigle: name
      }))
    } catch {
      communities = []
      organisations = []
    }
    formData.value = {
      ...formData.value,
      firstName: records[0].fields.Prenom,
      lastName: records[0].fields.Nom,
      phone_indicator: phone_indicator,
      phone: phone,
      position: records[0].fields.Fonction,
      communities: communities,
      organisations: organisations,
    }
  } catch (error) {
    console.error('Existing contact search error:', error)
    existingContact.value = null
  }
}

const fetchSuggestions = (type) => {
  return async (query) => {
    try {
      const records = await executeQuery(QUERIES.suggestions(type, query))
      const sortKey = {
        community: 'Libelle_et_departement',
        organisation: 'Nom_sigle',
        project: 'Nom_Complet'
      }[type]
      return records.map(record => record.fields).sort((a, b) => a[sortKey].localeCompare(b[sortKey]))
    } catch (error) {
      console.error('Search error:', error)
    }
  }
}

const resetContact = () => {
  formData.value = {
    ...formData.value,
    firstName: '',
    lastName: '',
    phone: '',
    phone_indicator: '+33',
    position: '',
    communities: [],
    organisations: [],
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

const getCurrentProject = async () => {
  currentProject.value = JSON.parse(localStorage.getItem('eventFormProject'))
}

const createOrganisations = async (newOrganisationNames = []) => {
  if (!newOrganisationNames.length) return []
  try {
    const response = await createRecords('ORGANISATIONS', newOrganisationNames.map(name => ({
      fields: {
        Nom: name,
        'Cree_par': currentUser.value.Nom_complet,
        'Derniere_mise_a_jour_par': currentUser.value.Nom_complet,
      }
    })))
    return response.records.map(record => record.id)
  } catch (error) {
    throw error
  }
}

const createContact = async (newOrganisationIds = []) => {
  try {
    const formatPhone = (indicator, value) =>
      value ? `${indicator} ${indicator.length === 3 ? value.substring(1) : value}` : ''

    const outputData = {
      'Prenom': formData.value.firstName,
      'Nom': formData.value.lastName,
      'Fonction': formData.value.position,
      'Email': formData.value.email,
      'Telephone': formatPhone(formData.value.phone_indicator, formData.value.phone),
      'Collectivites': ['L'].concat(formData.value.communities.map(e => e.id)),
      'Organisations': ['L'].concat(formData.value.organisations.filter(e => !e.is_new).map(e => e.id)).concat(newOrganisationIds),
      'Cree_par': currentUser.value.Nom_complet,
      'Derniere_mise_a_jour_par': currentUser.value.Nom_complet,
    }
    const response = await createRecords('CONTACTS', [{ fields: outputData }])
    return response.records[0].id
  } catch (error) {
    throw error
  }
}

const createInteraction = async (contactId) => {
  const subject = formData.value.subject === 'Autre' ? formData.value.subject_other : formData.value.subject
  const notes = [
    `Sujet de l'échange : ${subject}`,
    formData.value.products_interested.length ? [
      'Prospect intéressé par :',
      ...formData.value.products_interested.map((product) => {
        return `- ${product.name} - ${product.already_used ? 'Déjà utilisé' : 'Pas encore utilisé'}`
      })
    ].join('\n') : '',
    formData.value.notes
  ].filter(Boolean).join('\n\n')
  const outputData = {
    'Date': new Date().toISOString().split('T')[0],
    'Projets': ['L', currentProject.value.id],
    'Type': ['L', '📅 Evénement'],
    'Contacts': ['L', contactId],
    'Contact_s_interne_s_': ['L', currentUser.value.id],
    'Notes': notes,
    'Cree_par': currentUser.value.Nom_complet,
    'Derniere_mise_a_jour_par': currentUser.value.Nom_complet,
  }
  await createRecords('INTERACTIONS', [{ fields: outputData }])
}

const fetchProjects = fetchSuggestions('project')
const fetchCommunities = fetchSuggestions('community')
const fetchOrganisations = fetchSuggestions('organisation')
const debouncedFetchExistingContact = debounce(fetchExistingContact, 500)

// Computed
const existingContactAlert = computed(() => {
  if (!existingContact.value) return null
  return {
    title: 'Contact déjà enregistré',
    message: 'Un contact avec cet email existe déjà dans la base de données.'
  }
})

// Lifecycle hooks
onMounted(async () => {
  try {
    await initializeGrist()
    await retrieveFormOptions();
    await getCurrentUser();
    await getCurrentProject();
    if (!currentProject.value) {
      showProjectSelectionModal.value = true
    }
  } catch (err) {
    console.error('Initialization error:', err)
  }
})

watch(currentProject, (newVal) => {
  if (newVal) {
    localStorage.setItem('eventFormProject', JSON.stringify(newVal))
    initForm()
  }
})

</script>