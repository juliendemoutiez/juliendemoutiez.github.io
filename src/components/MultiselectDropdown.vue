<template>
  <div :class="containerClass || 'relative'" ref="dropdown">
    <input :id="id" ref="input" type="text" v-model="query" :placeholder="placeholder" @focus="isDropdownOpen = true"
      class="w-full" pattern="^(?!.*).*$" />
    <div v-if="isDropdownOpen"
      class="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
      <p v-if="!options && query === ''" class="px-4 py-2 text-slate-800 text-sm">
        Saisissez du texte pour rechercher...
      </p>
      <p v-else-if="loading" class="px-4 py-2 text-slate-800 text-sm">
        <Loader class="w-4 animate-spin" />
      </p>
      <p v-else-if="availableSuggestions.length === 0" class="px-4 py-2 text-slate-800 text-sm">
        Aucun résultat
      </p>
      <ul v-else-if="availableSuggestions.length">
        <li v-for="(suggestion, index) in availableSuggestions" :key="index" @click="handleSelect(suggestion)"
          class="px-4 py-2 hover:bg-blue-50 cursor-pointer text-slate-800 text-sm">
          {{ displayField ? suggestion[displayField] : suggestion }}
        </li>
      </ul>
    </div>

    <div class="mt-2 flex flex-wrap gap-2">
      <div v-for="(item, index) in selected" :key="item.id"
        class="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-1 text-blue-700 max-w-full">
        <p class="truncate text-sm">{{ displayField ? item[displayField] : item }}</p>
        <button type="button" @click="handleRemove(index)"
          class="rounded-full bg-blue-200 text-blue-700 transition hover:bg-blue-300 ml-2">
          <X class="w-3.5 h-3.5 m-0.5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { debounce } from 'lodash'
import { Loader, X } from 'lucide-vue-next';

const props = defineProps({
  id: {
    type: String,
    default: null
  },
  containerClass: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Rechercher...'
  },
  required: {
    type: Boolean,
    default: false
  },
  validationMessage: {
    type: String,
    default: ''
  },
  options: {
    type: Array,
    default: null
  },
  selected: {
    type: Array,
    required: true
  },
  fetchSuggestions: {
    type: Function,
    default: null
  },
  displayField: {
    type: String,
    default: null
  },
  customValidity: {
    type: String,
    default: ''
  },
  onSelect: {
    type: Function,
    default: null
  }
})

// Emits
const emit = defineEmits(['update:selected'])

// Refs
const dropdown = ref(null)
const input = ref(null)
const query = ref('')
const suggestions = ref(props.options || [])
const loading = ref(false)
const isDropdownOpen = ref(false)

// Handle outside clicks
const handleClickOutside = (event) => {
  if (dropdown.value && !dropdown.value.contains(event.target)) {
    isDropdownOpen.value = false
  }
}

// Methods
const debouncedFetch = debounce(async (searchQuery) => {
  if (!searchQuery.trim()) {
    suggestions.value = []
    return
  }
  suggestions.value = await props.fetchSuggestions(preprocessSearchQuery(searchQuery))
  loading.value = false
}, 500)

const preprocessSearchQuery = (query) => {
  return query
    .toLowerCase()
    .trim()
    .replace(/['-]/g, '')
    .split(/\s+/)
    .filter(Boolean)
}

const handleSelect = (suggestion) => {
  if (props.onSelect) {
    props.onSelect(suggestion)
  } else {
    emit('update:selected', [...props.selected, suggestion])
  }
  query.value = ''
  isDropdownOpen.value = false
}

const handleRemove = (index) => {
  emit('update:selected', props.selected.filter((_, i) => i !== index))
}

const updateInputValidation = () => {
  if (input.value) {
    input.value.required = props.required;
    input.value.setCustomValidity(
      props.required && props.selected.length === 0 && !query.value ? props.customValidity : ''
    );
  }
}

// Watches
watch(query, (newQuery) => {
  if (props.options) {
    suggestions.value = props.options.filter((option) => {
      return option.toLowerCase().includes(newQuery.toLowerCase())
    })
    return
  }
  loading.value = true
  debouncedFetch(newQuery)
})

watch(
  () => props.required,
  () => updateInputValidation()
)

// Computed
const availableSuggestions = computed(() => {
  return suggestions.value.filter((suggestion) => {
    return !props.selected.some((selected) => {
      if (props.options) {
        return selected === suggestion
      }
      return selected.id === suggestion.id
    })
  })
})

// Lifecycle hooks for event listener
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  updateInputValidation()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

</script>