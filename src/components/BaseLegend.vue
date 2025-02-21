<template>
  <div class="absolute" :class="positionClass" v-if="scale"
    :style="{ transform: `scale(${scale})`, zIndex: 1000, width: '350px' }">
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
