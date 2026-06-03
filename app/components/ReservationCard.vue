<template>
  <div class="card p-4 flex flex-col sm:flex-row sm:items-center gap-4">

    <!-- Resource icon + info -->
    <div class="flex items-start gap-3 flex-1 min-w-0">
      <div class="flex-shrink-0 w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
        <Icon :name="resourceIcon" class="w-5 h-5 text-primary-600" />
      </div>
      <div class="min-w-0">
        <p class="font-semibold text-gray-900 truncate">
          {{ reservation.resource?.name ?? 'Neznámý zdroj' }}
        </p>
        <p class="text-xs text-gray-500 mt-0.5">
          {{ resourceTypeLabel }}
          <span v-if="reservation.resource?.location"> · {{ reservation.resource.location }}</span>
        </p>

        <!-- Time range -->
        <div class="flex items-center gap-1.5 mt-2 text-sm text-gray-700">
          <Icon name="heroicons:clock" class="w-4 h-4 text-gray-400 shrink-0" />
          <span>{{ formatDate(reservation.start_time) }}</span>
          <span class="text-gray-400">–</span>
          <span>{{ formatEndTime(reservation.start_time, reservation.end_time) }}</span>
        </div>
      </div>
    </div>

    <!-- Status & action -->
    <div class="flex items-center gap-3 shrink-0">
      <span class="badge" :class="statusBadgeClass">
        {{ statusLabel }}
      </span>
      <AppButton
        v-if="canCancel"
        variant="outline"
        size="sm"
        :loading="cancelling"
        @click="emit('cancel', reservation.id)"
      >
        <Icon name="heroicons:x-circle" class="w-4 h-4" />
        Zrušit
      </AppButton>
    </div>

  </div>
</template>

<script setup lang="ts">
import { RESOURCE_TYPE_LABELS, RESOURCE_TYPE_ICONS, type Reservation } from '~/types'

const props = defineProps<{
  reservation: Reservation
  cancelling?: boolean
}>()

const emit = defineEmits<{
  cancel: [id: string]
}>()

const resourceIcon = computed(() =>
  RESOURCE_TYPE_ICONS[props.reservation.resource?.type ?? 'other'],
)

const resourceTypeLabel = computed(() =>
  RESOURCE_TYPE_LABELS[props.reservation.resource?.type ?? 'other'],
)

const isUpcoming = computed(() => new Date(props.reservation.end_time) > new Date())

const canCancel = computed(
  () => props.reservation.status === 'active' && isUpcoming.value,
)

const statusLabel = computed(() => {
  if (props.reservation.status === 'cancelled') return 'Zrušena'
  if (!isUpcoming.value) return 'Proběhla'
  return 'Aktivní'
})

const statusBadgeClass = computed(() => {
  if (props.reservation.status === 'cancelled') return 'bg-red-100 text-red-700'
  if (!isUpcoming.value) return 'bg-gray-100 text-gray-600'
  return 'bg-green-100 text-green-700'
})

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const formatEndTime = (start: string, end: string) => {
  const s = new Date(start)
  const e = new Date(end)
  // If same day, show only time
  if (s.toDateString() === e.toDateString()) {
    return e.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
  }
  return formatDate(end)
}
</script>
