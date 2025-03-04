<template>
  <div>
    <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="transform opacity-0"
      enter-to-class="transform opacity-100" leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform opacity-100" leave-to-class="transform opacity-0">
      <div role="alert" class="fixed bottom-20 rounded-xl border shadow p-4 left-0 right-0 mx-auto z-50"
        :class="getTypeClasses()" style="max-width: 400px" v-if="title">
        <div class="flex items-start gap-4">
          <Check v-if="type === 'success'" class="size-6" />
          <X v-if="type === 'error'" class="size-6" />
          <div class="flex-1">
            <p class="block font-medium text-slate-800">{{ title }}</p>
            <p class="mt-1 text-sm text-slate-800">{{ message }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { Check, X } from 'lucide-vue-next'

const props = defineProps({
  type: {
    type: String,
    default: 'success',
    validator: (value) => ['success', 'error'].includes(value)
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 3000
  }
})

const getTypeClasses = () => {
  switch (props.type) {
    case 'success':
      return 'border-green-200 bg-green-50 text-green-600'
    case 'error':
      return 'border-red-200 bg-red-50 text-red-600'
  }
}
</script>