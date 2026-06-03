<template>
  <NuxtLink
    :to="`/resources/${resource.id}`"
    class="card p-5 flex flex-col gap-3 hover:shadow-md hover:border-primary-300 transition-all duration-200 group cursor-pointer"
  >
    <!-- Header -->
    <div class="flex items-start justify-between gap-2">
      <div class="flex items-center gap-3 min-w-0">
        <div class="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
             :class="iconBgClass">
          <Icon :name="typeIcon" class="w-5 h-5" :class="iconColorClass" />
        </div>
        <div class="min-w-0">
          <h3 class="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors truncate">
            {{ resource.name }}
          </h3>
          <span class="badge mt-0.5" :class="typeBadgeClass">
            {{ typeLabel }}
          </span>
        </div>
      </div>
      <Icon
        name="heroicons:arrow-right"
        class="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors shrink-0 mt-1"
      />
    </div>

    <!-- Description -->
    <p v-if="resource.description" class="text-sm text-gray-500 line-clamp-2">
      {{ resource.description }}
    </p>

    <!-- Footer meta -->
    <div class="flex items-center gap-4 text-xs text-gray-500 mt-auto pt-2 border-t border-gray-100">
      <span v-if="resource.location" class="flex items-center gap-1">
        <Icon name="heroicons:map-pin" class="w-3.5 h-3.5" />
        {{ resource.location }}
      </span>
      <span class="flex items-center gap-1 ml-auto">
        <Icon name="heroicons:squares-2x2" class="w-3.5 h-3.5" />
        Dostupnost: {{ resource.quantity }} ks
      </span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import { RESOURCE_TYPE_LABELS, RESOURCE_TYPE_ICONS, type Resource, type ResourceType } from '~/types'

const props = defineProps<{ resource: Resource }>()

const typeLabel = computed(() => RESOURCE_TYPE_LABELS[props.resource.type])
const typeIcon  = computed(() => RESOURCE_TYPE_ICONS[props.resource.type])

const typeBadgeConfig: Record<ResourceType, { bg: string; color: string; badge: string }> = {
  classroom: { bg: 'bg-blue-50',   color: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700' },
  laptop:    { bg: 'bg-violet-50', color: 'text-violet-600', badge: 'bg-violet-100 text-violet-700' },
  projector: { bg: 'bg-amber-50',  color: 'text-amber-600',  badge: 'bg-amber-100 text-amber-700' },
  camera:    { bg: 'bg-green-50',  color: 'text-green-600',  badge: 'bg-green-100 text-green-700' },
  other:     { bg: 'bg-gray-50',   color: 'text-gray-500',   badge: 'bg-gray-100 text-gray-600' },
}

const config = computed(() => typeBadgeConfig[props.resource.type])
const iconBgClass    = computed(() => config.value.bg)
const iconColorClass = computed(() => config.value.color)
const typeBadgeClass = computed(() => config.value.badge)
</script>
