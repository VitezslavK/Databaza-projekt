<template>
  <div :class="['flex flex-col items-center justify-center gap-3', fullPage ? 'min-h-[40vh]' : '']">
    <div
      :class="[
        'border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin',
        sizeClasses[size],
      ]"
    />
    <p v-if="text" class="text-sm text-gray-500">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullPage?: boolean
}

withDefaults(defineProps<Props>(), {
  size: 'md',
  text: '',
  fullPage: false,
})

const sizeClasses = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}
</script>
