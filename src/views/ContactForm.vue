<template>
  <BaseForm title="Ajouter un contact" icon="🧑" :alert="alert" :warning="duplicateMessage"
    :submit-disabled="isSubmitting || duplicateFound === 'email' || duplicateFound == 'both'" @submit="handleSubmit">
    <template #form-content v-if="formData">
      <div class="grid gap-y-8">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div class="col-span-1">
            <p class="form-header">Coordonnées</p>
          </div>
          <div class="col-span-1 sm:col-span-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="col-span-1">
                <label class="form-label" for="civility">Civilité *</label>
                <select id="civility" v-model="formData.civility" required>
                  <option disabled selected value>Sélectionner...</option>
                  <option value="Mme">Mme</option>
                  <option value="M.">M.</option>
                </select>
              </div>
              <div class="col-span-1 col-start-1">
                <label class="form-label" for="firstName">Prénom *</label>
                <input id="firstName" v-model="formData.firstName" type="text" placeholder="Jean"
                  @input="debouncedFetchDuplicates" required />
              </div>
              <div class="col-span-1">
                <label class="form-label" for="lastName">Nom *</label>
                <input id="lastName" v-model="formData.lastName" type="text" placeholder="DUPONT" @input="() => {
                  formData.lastName = formData.lastName.toUpperCase()
                  debouncedFetchDuplicates()
                }" required />
              </div>
              <div class="col-span-1">
                <label class="form-label" for="email">Email *</label>
                <input v-model="formData.email" type="email" id="email" placeholder="jean@dupont.fr" required @input="() => {
                  formData.email = formData.email.toLowerCase()
                  debouncedFetchDuplicates()
                }" />
              </div>
              <div class="col-span-1">
                <label class="form-label" for="email2">Email 2</label>
                <input v-model="formData.email2" type="email" id="email2"
                  onInput="this.value = this.value.toLowerCase()" placeholder="jean@dupont.fr" />
              </div>
              <div class="col-span-1">
                <label class="form-label" for="phone">Téléphone</label>
                <div class="flex">
                  <select class="w-24 mr-2" v-model="formData.phone_indicator" id="phone_indicator" required>
                    <option v-for="(indicator, index) of PHONE_INDICATORS" :key="index" :value="indicator.value">{{
                      indicator.value
                      }}</option>
                  </select>
                  <input v-model="formData.phone" type="tel"
                    :pattern="formData.phone_indicator.length === 3 ? PHONE_PATTERNS.metropolitan.pattern : PHONE_PATTERNS.overseas.pattern"
                    id="phone"
                    :placeholder="formData.phone_indicator.length === 3 ? PHONE_PATTERNS.metropolitan.placeholder : PHONE_PATTERNS.overseas.placeholder"
                    @input="handlePhoneFormat($event, 'phone')" />
                </div>
              </div>
              <div class="col-span-1">
                <label class="form-label" for="phone2">Téléphone 2</label>
                <div class="flex">
                  <select class="w-24 mr-2" v-model="formData.phone2_indicator" id="phone2_indicator" required>
                    <option v-for="(indicator, index) of PHONE_INDICATORS" :key="index" :value="indicator.value">{{
                      indicator.value
                      }}</option>
                  </select>
                  <input v-model="formData.phone2" type="tel"
                    :pattern="formData.phone2_indicator.length === 3 ? '[0-9]{2} [0-9]{2} [0-9]{2} [0-9]{2} [0-9]{2}' : '[0-9]{2} [0-9]{2} [0-9]{2} [0-9]{2}'"
                    id="phone2" :placeholder="formData.phone2_indicator.length === 3 ? '01 23 45 67 89' : '01 23 45 67'"
                    @input="handlePhoneFormat($event, 'phone2')" />
                </div>
              </div>
            </div>
          </div>
          <div class="col-span-1">
            <p class="form-header">Informations professionnelles</p>
            <p class="form-subheader">Le contact doit être rattaché à une collectivité ou une organisation (ou les deux)
            </p>
          </div>
          <div class="col-span-1 sm:col-span-2">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="col-span-1 sm:col-span-2">
                <label class="form-label" for="position">Fonction</label>
                <input v-model="formData.position" type="text" id="position" placeholder="Maire" />
              </div>
              <div class="col-span-1">
                <label class="form-label" for="communities">Collectivités *</label>
                <MultiselectDropdown id="communities" v-model:selected="formData.communities"
                  :fetchSuggestions="fetchCommunities" displayField="Libelle_et_departement"
                  :required="!hasRequiredSelections"
                  customValidity="Veuillez sélectionner une collectivité ou une organisation" />
              </div>
              <div class="col-span-1">
                <label class="form-label" for="organisations">Organisations *</label>
                <MultiselectDropdown id="organisations" v-model:selected="formData.organisations"
                  :fetchSuggestions="fetchOrganisations" displayField="Nom_sigle" :required="false" />
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
import { useAlert } from '@/composables/useAlert'
import BaseForm from '@/components/BaseForm.vue'
import MultiselectDropdown from '@/components/MultiselectDropdown.vue'
import {
  PHONE_INDICATORS,
  PHONE_PATTERNS,
  CONTACT_FORM_DATA,
} from '@/constants/index'
import { formatPhoneNumber } from '@/utils/phoneFormat'
import { replaceAccents } from '@/utils/sqlUtils'
import { normalizeText } from '@/utils/textUtils'

// Constants
const QUERIES = {
  duplicate: (fullName, email) => {
    const nameField = 'Nom_complet'
    const fullNameQuery = fullName ? `${replaceAccents(nameField)} = '${normalizeText(fullName)}'` : ''
    const emailQuery = email ? `LOWER(Email) = LOWER('${email}')` : ''
    return `
      SELECT id, Nom_complet, Email
      FROM CONTACTS
      WHERE ${[fullNameQuery, emailQuery].filter(q => q).join(' OR ')}
      LIMIT 1
    `
  },
  suggestions: (type, terms) => {
    const tableName = type === 'community' ? 'COLLECTIVITES' : 'ORGANISATIONS'
    const nameField = type === 'community' ? 'Libelle_et_departement' : 'Nom_sigle'

    const whereConditions = terms.map(term =>
      `${replaceAccents(nameField)} LIKE '%' || '${normalizeText(term)}' || '%'`
    ).join(' AND ');

    return `
      SELECT id, ${nameField}
      FROM ${tableName}
      WHERE ${whereConditions}
      ORDER BY ${nameField}
      LIMIT 10
    `
  }
}

// Refs
const duplicateFound = ref(null)
const formData = ref(null)
const isSubmitting = ref(false)

// Initialise composables
const { executeQuery, initializeGrist } = useGrist()
const { alert, showSuccess, showError } = useAlert()

// Methods
const handlePhoneFormat = (_event, key) => {
  const indicator = formData.value[`${key}_indicator`]
  formData.value[key] = formatPhoneNumber(formData.value[key], indicator)
}

const handleSubmit = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    const formatPhone = (indicator, value) =>
      value ? `${indicator} ${indicator.length === 3 ? value.substring(1) : value}` : ''

    const outputData = {
      'Civilite': formData.value.civility,
      'Prenom': formData.value.firstName,
      'Nom': formData.value.lastName,
      'Fonction': formData.value.position,
      'Email': formData.value.email,
      'Email_2': formData.value.email2,
      'Telephone': formatPhone(formData.value.phone_indicator, formData.value.phone),
      'Telephone_2': formatPhone(formData.value.phone2_indicator, formData.value.phone2),
      'Collectivites': ['L'].concat(formData.value.communities.map(e => e.id)),
      'Organisations': ['L'].concat(formData.value.organisations.map(e => e.id)),
    }

    const actions = [['AddRecord', 'CONTACTS', undefined, outputData]]
    await grist.docApi.applyUserActions(actions)

    initForm()
    showSuccess('Le contact a été créé avec succès.')
  } catch (error) {
    console.error(error);
    showError('Une erreur s\'est produite lors de la création du contact.')
  } finally {
    isSubmitting.value = false
  }
}

const initForm = () => {
  formData.value = JSON.parse(JSON.stringify(CONTACT_FORM_DATA))
  duplicateFound.value = null
}

const fetchDuplicates = async () => {
  if ((!formData.value.firstName || !formData.value.lastName) && !formData.value.email) {
    duplicateFound.value = null
    return
  }

  try {
    const fullName = formData.value.firstName && formData.value.lastName
      ? `${formData.value.lastName} ${formData.value.firstName}`
      : null

    const records = await executeQuery(QUERIES.duplicate(fullName, formData.value.email))

    if (!records.length) {
      duplicateFound.value = null
      return
    }

    const record = records[0]
    const isEmailMatch = formData.value.email &&
      record.fields.Email.toLowerCase() === formData.value.email.toLowerCase()
    const isNameMatch = fullName &&
      normalizeText(record.fields.Nom_complet.toLowerCase()) === normalizeText(fullName.toLowerCase())

    if (isEmailMatch && isNameMatch) {
      duplicateFound.value = 'both'
    } else if (isNameMatch) {
      duplicateFound.value = 'name'
    } else if (isEmailMatch) {
      duplicateFound.value = 'email'
    }
  } catch (error) {
    console.error('Duplicate search error:', error)
    duplicateFound.value = null
  }
}

const fetchSuggestions = (type) => {
  return async (query) => {
    try {
      const records = await executeQuery(QUERIES.suggestions(type, query))
      const sortKey = type === 'community' ? 'Libelle_et_departement' : 'Nom_sigle'
      return records.map(record => record.fields).sort((a, b) => a[sortKey].localeCompare(b[sortKey]))
    } catch (error) {
      console.error('Search error:', error)
    }
  }
}

const fetchCommunities = fetchSuggestions('community')
const fetchOrganisations = fetchSuggestions('organisation')
const debouncedFetchDuplicates = debounce(fetchDuplicates, 500)

// Computed
const hasRequiredSelections = computed(() =>
  formData.value.communities.length > 0 ||
  formData.value.organisations.length > 0
)

const duplicateMessage = computed(() => {
  if (!duplicateFound.value) return null

  const messages = {
    both: {
      title: 'Doublon',
      message: 'Un contact du même nom et email existe déjà'
    },
    name: {
      title: 'Doublon potentiel',
      message: 'Un contact du même nom existe déjà'
    },
    email: {
      title: 'Doublon',
      message: 'Un contact du même email existe déjà'
    }
  }

  return messages[duplicateFound.value]
})

// Lifecycle hooks
onMounted(async () => {
  try {
    await initializeGrist()
    await initForm()
  } catch (err) {
    console.error('Initialization error:', err)
  }
})

</script>