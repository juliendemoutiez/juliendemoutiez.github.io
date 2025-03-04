<template>
  <div v-if="props.alert" role="alert" class="rounded border border-yellow-200 bg-yellow-50 px-4 py-2 flex-1">
    <div class="flex items-center gap-2 text-yellow-800">
      <AlertCircle class="size-5" />
      <p class="block font-medium text-xs">{{ props.alert.title }}</p>
    </div>
    <p class="mt-1 text-xs text-yellow-700">{{ props.alert.message }}</p>
  </div>
</template>

<script setup>
import { AlertCircle } from 'lucide-vue-next'

const props = defineProps({
  alert: {
    type: Object,
    default: null
  }
})
</script>
