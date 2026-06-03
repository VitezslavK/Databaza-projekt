<template>
  <div class="flex flex-col gap-6">

    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="page-title">Správa zdrojů</h1>
        <p class="text-gray-500 text-sm mt-1">Přidávejte, upravujte a odstraňujte učebny a vybavení.</p>
      </div>
      <AppButton @click="openAddModal">
        <Icon name="heroicons:plus" class="w-4 h-4" />
        Přidat zdroj
      </AppButton>
    </div>

    <!-- Error banner -->
    <div v-if="error" class="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
      <Icon name="heroicons:exclamation-circle" class="w-4 h-4 shrink-0" />
      {{ error }}
    </div>

    <!-- Table -->
    <LoadingSpinner v-if="loading" text="Načítám zdroje…" full-page />

    <div v-else-if="resources.length === 0" class="text-center py-16 text-gray-400">
      <Icon name="heroicons:inbox" class="w-12 h-12 mx-auto mb-3 opacity-40" />
      <p>Žádné zdroje zatím neexistují.</p>
    </div>

    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-200">
              <th class="text-left px-4 py-3 font-semibold text-gray-700">Název</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-700">Typ</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-700 hidden sm:table-cell">Umístění</th>
              <th class="text-center px-4 py-3 font-semibold text-gray-700 hidden md:table-cell">Ks</th>
              <th class="text-right px-4 py-3 font-semibold text-gray-700">Akce</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="res in resources"
              :key="res.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-4 py-3">
                <span class="font-medium text-gray-900">{{ res.name }}</span>
                <p v-if="res.description" class="text-xs text-gray-400 truncate max-w-[200px]">
                  {{ res.description }}
                </p>
              </td>
              <td class="px-4 py-3">
                <span class="badge bg-gray-100 text-gray-700">{{ typeLabel(res.type) }}</span>
              </td>
              <td class="px-4 py-3 text-gray-500 hidden sm:table-cell">
                {{ res.location ?? '–' }}
              </td>
              <td class="px-4 py-3 text-center text-gray-700 hidden md:table-cell">
                {{ res.quantity }}
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <AppButton variant="ghost" size="sm" @click="openEditModal(res)">
                    <Icon name="heroicons:pencil" class="w-4 h-4" />
                  </AppButton>
                  <AppButton variant="ghost" size="sm" class="text-red-500 hover:bg-red-50" @click="openDeleteModal(res)">
                    <Icon name="heroicons:trash" class="w-4 h-4" />
                  </AppButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add / Edit modal -->
    <AppModal v-model="showFormModal" :title="editTarget ? 'Upravit zdroj' : 'Přidat nový zdroj'">
      <form class="flex flex-col gap-4" @submit.prevent="handleSave">
        <div class="form-group">
          <label for="f_name">Název <span class="text-red-500">*</span></label>
          <input id="f_name" v-model="form.name" type="text" required placeholder="Učebna A101" />
        </div>

        <div class="form-group">
          <label for="f_type">Typ <span class="text-red-500">*</span></label>
          <select id="f_type" v-model="form.type" required>
            <option v-for="(label, value) in TYPE_LABELS" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="f_desc">Popis</label>
          <textarea
            id="f_desc"
            v-model="form.description"
            rows="2"
            class="resize-none"
            placeholder="Stručný popis zdroje…"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-group">
            <label for="f_location">Umístění</label>
            <input id="f_location" v-model="form.location" type="text" placeholder="Budova A, 1. patro" />
          </div>
          <div class="form-group">
            <label for="f_qty">Počet kusů</label>
            <input id="f_qty" v-model.number="form.quantity" type="number" min="1" required />
          </div>
        </div>

        <div v-if="formError" class="text-sm text-red-600 flex items-center gap-1.5">
          <Icon name="heroicons:exclamation-circle" class="w-4 h-4" />
          {{ formError }}
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <AppButton variant="secondary" @click="showFormModal = false">Zrušit</AppButton>
          <AppButton type="submit" :loading="formLoading">
            {{ editTarget ? 'Uložit změny' : 'Přidat zdroj' }}
          </AppButton>
        </div>
      </form>
    </AppModal>

    <!-- Delete confirmation modal -->
    <AppModal v-model="showDeleteModal" title="Smazat zdroj" size="sm">
      <p class="text-sm text-gray-600">
        Opravdu chcete smazat zdroj <strong>{{ deleteTarget?.name }}</strong>?
        Tato akce je nevratná a odstraní i všechny rezervace tohoto zdroje.
      </p>
      <template #footer>
        <AppButton variant="secondary" @click="showDeleteModal = false">Zrušit</AppButton>
        <AppButton variant="danger" :loading="deleteLoading" @click="handleDelete">Smazat</AppButton>
      </template>
    </AppModal>

  </div>
</template>

<script setup lang="ts">
import { RESOURCE_TYPE_LABELS, type Resource, type ResourceFormData, type ResourceType } from '~/types'

definePageMeta({ middleware: 'admin' })

const { resources, loading, error, fetchResources, createResource, updateResource, deleteResource } = useResources()

const TYPE_LABELS = RESOURCE_TYPE_LABELS

const emptyForm = (): ResourceFormData => ({
  name: '',
  type: 'classroom',
  description: '',
  location: '',
  quantity: 1,
})

const form         = reactive<ResourceFormData>(emptyForm())
const formError    = ref<string | null>(null)
const formLoading  = ref(false)
const editTarget   = ref<Resource | null>(null)

const showFormModal   = ref(false)
const showDeleteModal = ref(false)
const deleteTarget    = ref<Resource | null>(null)
const deleteLoading   = ref(false)

const typeLabel = (type: ResourceType) => RESOURCE_TYPE_LABELS[type]

const openAddModal = () => {
  editTarget.value = null
  Object.assign(form, emptyForm())
  formError.value = null
  showFormModal.value = true
}

const openEditModal = (res: Resource) => {
  editTarget.value = res
  Object.assign(form, {
    name:        res.name,
    type:        res.type,
    description: res.description ?? '',
    location:    res.location ?? '',
    quantity:    res.quantity,
  })
  formError.value = null
  showFormModal.value = true
}

const openDeleteModal = (res: Resource) => {
  deleteTarget.value = res
  showDeleteModal.value = true
}

const handleSave = async () => {
  if (!form.name.trim()) {
    formError.value = 'Název nesmí být prázdný.'
    return
  }
  formLoading.value = true
  formError.value = null
  try {
    if (editTarget.value) {
      await updateResource(editTarget.value.id, form)
    } else {
      await createResource(form)
    }
    showFormModal.value = false
    await fetchResources()
  } catch (e: any) {
    formError.value = e.message ?? 'Operace se nezdařila.'
  } finally {
    formLoading.value = false
  }
}

const handleDelete = async () => {
  if (!deleteTarget.value) return
  deleteLoading.value = true
  try {
    await deleteResource(deleteTarget.value.id)
    showDeleteModal.value = false
    deleteTarget.value = null
    await fetchResources()
  } catch (e: any) {
    error.value = e.message
  } finally {
    deleteLoading.value = false
  }
}

onMounted(async () => {
  await fetchResources()
})
</script>
