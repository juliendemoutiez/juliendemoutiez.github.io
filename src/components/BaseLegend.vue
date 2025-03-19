<template>
  <div class="absolute z-[1000] pointer-events-none" :class="positionClass">
    <div class="h-[calc(100vh-2rem)] overflow-auto" style="width: 350px;">
      <div class="flex flex-col min-h-full" :class="positionClass.includes('bottom') ? 'justify-end' : 'justify-start'">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    scale: {
      type: Number,
      required: true
    },
    position: {
      type: String,
      default: 'bottom-right',
      validator: (value) => ['top-right', 'bottom-right', 'bottom-left'].includes(value)
    }
  },
  computed: {
    positionClass() {
      const positions = {
        'top-right': 'top-4 right-4 origin-top-right',
        'bottom-right': 'bottom-4 right-4 origin-bottom-right',
        'bottom-left': 'bottom-4 left-4 origin-bottom-left'
      };
      return positions[this.position];
    },
  }
}
</script>

<!-- :style="{ transform: `scale(${scale})`, transformOrigin: 'bottom left' }" -->