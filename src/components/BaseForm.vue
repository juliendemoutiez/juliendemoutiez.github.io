<template>
  <Alert v-if="props.alert" v-bind="props.alert" />
  <div class="h-full px-4 pt-10 bg-slate-100 flex flex-col items-center overflow-auto">
    <div class="bg-white shadow-lg rounded-t-lg w-full max-w-screen-lg flex-1 h-fit">
      <form @submit="handleSubmit">
        <div class="border-b border-slate-100 p-6 flex justify-between items-center w-full">
          <div class="flex flex-row space-x-4 items-center">
            <div class="flex justify-center items-center bg-slate-100 rounded-xl" style="width: 50px; height: 50px;">
              <p class="text-xl">{{ props.icon }}</p>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-slate-800">{{ props.title }}</h2>
              <p class="text-slate-500">{{ props.subtitle }}</p>
            </div>
          </div>
          <button type="submit"
            class="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            :disabled="props.submitDisabled">
            Enregistrer
          </button>
        </div>
        <div class="p-6 space-y-6">
          <div v-if="props.warning" role="alert"
            class="rounded border border-yellow-200 bg-yellow-50 px-4 py-2 flex-1 mb-6">
            <div class="flex items-center gap-2 text-yellow-800">
              <AlertCircle class="size-5" />
              <p class="block font-medium text-xs">{{ props.warning.title }}</p>
            </div>
            <p class="mt-1 text-xs text-yellow-700">{{ props.warning.message }}</p>
          </div>
          <slot name="form-content"></slot>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { AlertCircle } from 'lucide-vue-next'
import Alert from '@/components/Alert.vue'

const props = defineProps({
  alert: {
    type: Object,
    default: null
  },
  icon: {
    type: String,
    default: null
  },
  submitDisabled: {
    type: Boolean,
    default: false
  },
  subtitle: {
    type: String,
    default: null
  },
  title: {
    type: String,
    required: true
  },
  warning: {
    type: Object,
    default: null
  },
})

const emit = defineEmits(['submit'])

const handleSubmit = (e) => {
  e.preventDefault()
  emit('submit')
}
</script>
