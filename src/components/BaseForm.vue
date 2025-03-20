<template>
  <Toast v-if="props.toast" :type="props.toast.type" :title="props.toast.title" :message="props.toast.message" />
  <div class="h-full sm:px-4 sm:pt-10 bg-slate-100 flex flex-col items-center overflow-auto">
    <div class="bg-white shadow-lg sm:rounded-t-lg w-full max-w-screen-lg flex-1 h-fit relative">
      <form @submit="handleSubmit">
        <div
          class="border-b border-slate-100 p-6 flex justify-between items-center w-full sticky sm:relative top-0 z-10 bg-white">
          <div class="flex flex-row space-x-4 items-center">
            <div class="flex justify-center items-center bg-slate-100 rounded-xl flex-shrink-0"
              style="width: 50px; height: 50px;">
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
          <Alert v-if="props.alert" :alert="props.alert" />
          <slot name="form-content"></slot>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import Toast from '@/components/Toast.vue'
import Alert from '@/components/Alert.vue'

const props = defineProps({
  toast: {
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
  alert: {
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
