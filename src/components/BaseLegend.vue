<template>
  <div class="absolute bg-white rounded-xl shadow-lg p-6" :class="positionClass" v-if="scale"
    :style="{ transform: `scale(${scale})`, zIndex: 1000, transformOrigin: 'bottom right' }">
    <slot></slot>
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
      validator: (value) => ['bottom-right', 'bottom-left'].includes(value)
    }
  },
  computed: {
    positionClass() {
      const positions = {
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4'
      };
      return positions[this.position];
    }
  }
}
</script>
