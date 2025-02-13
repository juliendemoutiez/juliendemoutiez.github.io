export const PHONE_INDICATORS = [
  { value: '+33', label: 'France (+33)' },
  { value: '+262', label: 'Réunion (+262)' },
  { value: '+508', label: 'Saint-Pierre-et-Miquelon (+508)' },
  { value: '+590', label: 'Guadeloupe (+590)' },
  { value: '+594', label: 'Guyane française (+594)' },
  { value: '+596', label: 'Martinique (+596)' },
  { value: '+681', label: 'Wallis-et-Futuna (+681)' },
  { value: '+687', label: 'Nouvelle-Calédonie (+687)' },
  { value: '+689', label: 'Polynésie française (+689)' },
]

export const PHONE_PATTERNS = {
  metropolitan: {
    pattern: '[0-9]{2} [0-9]{2} [0-9]{2} [0-9]{2} [0-9]{2}',
    placeholder: '01 23 45 67 89',
    length: 10,
  },
  overseas: {
    pattern: '[0-9]{2} [0-9]{2} [0-9]{2} [0-9]{2}',
    placeholder: '01 23 45 67',
    length: 8,
  },
}

export const CONTACT_FORM_DATA = {
  civility: '',
  firstName: '',
  lastName: '',
  position: '',
  email: '',
  email2: '',
  phone: '',
  phone_indicator: '+33',
  phone2: '',
  phone2_indicator: '+33',
  communities: [],
  organisations: [],
}

export const ORGANISATION_FORM_DATA = {
  name: '',
  typologies: [],
  acronym: '',
  legalStatuses: [],
  website: '',
  communities: [],
}

export const PROJECT_FORM_DATA = {
  name: '',
  description: '',
  product: '',
  type: '',
  start_date: new Date().toISOString().split('T')[0],
  end_date: new Date().toISOString().split('T')[0],
  sign_up_form_url: '',
  sign_up_form_edit_url: '',
  owners: [],
}

export const INTERACTION_FORM_DATA = {
  date: new Date().toISOString().split('T')[0],
  projects: [],
  types: [],
  internalContacts: [],
  contacts: [],
  Notes: '',
}
