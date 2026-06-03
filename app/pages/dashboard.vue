<template>
  <div class="flex flex-col gap-6">

    <!-- Header -->
    <div>
      <h1 class="page-title">Moje rezervace</h1>
      <p class="text-gray-500 text-sm mt-1">Přehled všech vašich rezervací — nadcházejících i minulých.</p>
    </div>

    <LoadingSpinner v-if="loading" text="Načítám rezervace…" full-page />

    <template v-else>

      <!-- Upcoming -->
      <section>
        <h2 class="section-title mb-3 flex items-center gap-2">
          <Icon name="heroicons:calendar-days" class="w-5 h-5 text-primary-600" />
          Nadcházející rezervace
          <span class="badge bg-primary-100 text-primary-700">{{ upcomingReservations.length }}</span>
        </h2>

        <div v-if="upcomingReservations.length === 0" class="card p-8 text-center text-gray-400">
          <Icon name="heroicons:calendar" class="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>Nemáte žádné nadcházející rezervace.</p>
          <NuxtLink
            to="/resources"
            class="inline-flex items-center gap-1.5 text-sm text-primary-600 hover:underline mt-3"
          >
            <Icon name="heroicons:plus-circle" class="w-4 h-4" />
            Vytvořit novou rezervaci
          </NuxtLink>
        </div>

        <div v-else class="flex flex-col gap-3">
          <ReservationCard
            v-for="r in upcomingReservations"
            :key="r.id"
            :reservation="r"
            :cancelling="cancellingId === r.id"
            @cancel="handleCancel"
          />
        </div>
      </section>

      <!-- Past / cancelled -->
      <section>
        <h2 class="section-title mb-3 flex items-center gap-2">
          <Icon name="heroicons:archive-box" class="w-5 h-5 text-gray-400" />
          Historie rezervací
          <span class="badge bg-gray-100 text-gray-600">{{ pastReservations.length }}</span>
        </h2>

        <div v-if="pastReservations.length === 0" class="card p-6 text-center text-gray-400 text-sm">
          Žádná historie rezervací.
        </div>

        <div v-else class="flex flex-col gap-3">
          <ReservationCard
            v-for="r in pastReservations"
            :key="r.id"
            :reservation="r"
          />
        </div>
      </section>

    </template>

    <!-- Cancel confirm modal -->
    <AppModal v-model="showCancelModal" title="Zrušit rezervaci" size="sm">
      <p class="text-sm text-gray-600">
        Opravdu chcete zrušit tuto rezervaci?
        Akci nelze vrátit zpět.
      </p>
      <template #footer>
        <AppButton variant="secondary" @click="showCancelModal = false">Zachovat</AppButton>
        <AppButton variant="danger" :loading="cancelLoading" @click="confirmCancel">Zrušit rezervaci</AppButton>
      </template>
    </AppModal>

  </div>
</template>

<script setup lang="ts">
import type { Reservation } from '~/types'

definePageMeta({ middleware: 'auth' })

const { reservations, loading, fetchMyReservations, cancelReservation } = useReservations()

const now = new Date()

const upcomingReservations = computed(() =>
  reservations.value.filter(
    (r) => r.status === 'active' && new Date(r.end_time) > now,
  ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
)

const pastReservations = computed(() =>
  reservations.value.filter(
    (r) => r.status === 'cancelled' || new Date(r.end_time) <= now,
  ).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()),
)

const showCancelModal = ref(false)
const cancellingId    = ref<string | null>(null)
const cancelLoading   = ref(false)
const pendingCancelId = ref<string | null>(null)

const handleCancel = (id: string) => {
  pendingCancelId.value = id
  showCancelModal.value = true
}

const confirmCancel = async () => {
  if (!pendingCancelId.value) return
  cancelLoading.value = true
  cancellingId.value  = pendingCancelId.value
  try {
    await cancelReservation(pendingCancelId.value)
    showCancelModal.value = false
    await fetchMyReservations()
  } finally {
    cancelLoading.value  = false
    cancellingId.value   = null
    pendingCancelId.value = null
  }
}

onMounted(async () => {
  await fetchMyReservations()
})
</script>
