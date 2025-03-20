<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="fixed inset-0 z-[1000] w-full h-full bg-black/70 flex justify-center items-center"
        @click="emit('close')">
        <div class="relative flex flex-1 bg-white rounded-2xl p-6 w-full max-h-[90vh] overflow-y-auto flex-col max-w-xl"
          @click.stop>
          <div>
            <div class="flex flex-1 justify-between items-center mb-6">
              <h2 class="text-xl font-bold">{{ title }}</h2>
              <button @click="emit('close')" class="text-grey hover:text-darkgrey">
                <X class="w-5" />
              </button>
            </div>
          </div>
          <div class="relative flex flex-1 flex-col">
            <slot name="modal-content"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { X } from 'lucide-vue-next'

defineProps({
  title: {
    type: String,
    required: true,
  },
  show: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['close'])
</script>

<style>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
</style>