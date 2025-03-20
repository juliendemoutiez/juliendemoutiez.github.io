<template>
  <div :class="containerClass || 'relative'" ref="dropdown">
    <input :id="id" ref="input" type="text" v-model="query" :placeholder="placeholder" @focus="isDropdownOpen = true"
      @keydown="handleKeydown" class="w-full" pattern="^(?!.*).*$" :disabled="disabled" />
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
        <li v-for="(suggestion, index) in availableSuggestions" :key="index" @click="handleSelect(suggestion)" :class="[
          'px-4 py-2 cursor-pointer text-slate-800 text-sm flex items-center justify-between',
          selectedIndex === index ? 'bg-blue-50' : 'hover:bg-blue-50'
        ]">
          {{ displayField ? suggestion[displayField] : suggestion }}
          <button v-if="suggestion.is_new" type="button" @click="handleSelect(suggestion)"
            class="ml-2 text-blue-500 hover:text-blue-800">
            <Plus class="w-4 h-4" />
          </button>
        </li>
      </ul>
    </div>

    <div class="mt-2 flex flex-wrap gap-2" v-if="selected.length > 0 && showSelection">
      <slot name="selected-item" v-for="(item, index) in selected" :key="item.id" :item="item" :index="index"
        :remove="handleRemove">
        <div
          class="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-1 text-blue-700 max-w-full">
          <p class="truncate text-sm">{{ displayField ? item[displayField] : item }}</p>
          <button type="button" @click="handleRemove(index)" v-if="!disabled"
            class="rounded-full bg-blue-200 text-blue-700 transition hover:bg-blue-300 ml-2">
            <X class="w-3.5 h-3.5 m-0.5" />
          </button>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { debounce } from 'lodash'
import { Loader, X, Plus } from 'lucide-vue-next';

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
  },
  allowNew: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  showSelection: {
    type: Boolean,
    default: true
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
const selectedIndex = ref(-1)

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
  input.value.blur()
}

const handleRemove = (index) => {
  emit('update:selected', props.selected.filter((_, i) => i !== index))
}

const handleKeydown = (event) => {
  if (!isDropdownOpen.value || !availableSuggestions.value.length) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedIndex.value = (selectedIndex.value + 1) % availableSuggestions.value.length
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedIndex.value = selectedIndex.value <= 0
        ? availableSuggestions.value.length - 1
        : selectedIndex.value - 1
      break
    case 'Enter':
      event.preventDefault()
      if (selectedIndex.value >= 0) {
        handleSelect(availableSuggestions.value[selectedIndex.value])
      }
      break
  }
}

const updateInputValidation = () => {
  if (input.value) {
    input.value.required = props.required;
    input.value.setCustomValidity(
      props.required && props.selected.length === 0 && !query.value ? props.customValidity : ''
    );
  }
}

// Add this method after other methods
const scrollToSelected = () => {
  if (selectedIndex.value < 0) return

  const container = dropdown.value?.querySelector('.overflow-auto')
  const selectedElement = container?.querySelector(`li:nth-child(${selectedIndex.value + 1})`)

  if (container && selectedElement) {
    const containerHeight = container.clientHeight
    const elementTop = selectedElement.offsetTop
    const elementHeight = selectedElement.offsetHeight

    // If element is not fully visible
    if (elementTop < container.scrollTop ||
      elementTop + elementHeight > container.scrollTop + containerHeight) {
      container.scrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2)
    }
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

watch(isDropdownOpen, (newValue) => {
  if (!newValue) {
    selectedIndex.value = -1
  }
})

watch(selectedIndex, () => {
  nextTick(() => {
    scrollToSelected()
  })
})

// Computed
const availableSuggestions = computed(() => {
  if (!suggestions.value) return []
  const currentSuggestions = suggestions.value
  if (props.allowNew) {
    currentSuggestions.unshift({ id: query.value, is_new: true, [props.displayField]: query.value })
  }
  return currentSuggestions.filter((suggestion) => {
    return !props.selected.some((selected) => {
      return selected[props.displayField].toLowerCase() === suggestion[props.displayField].toLowerCase()
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