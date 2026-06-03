export type UserRole = 'student' | 'teacher' | 'admin'
export type ResourceType = 'classroom' | 'laptop' | 'projector' | 'camera' | 'other'
export type ReservationStatus = 'active' | 'cancelled'

export interface Profile {
  id: string
  email: string
  role: UserRole
  display_name: string | null
  created_at: string
}

export interface Resource {
  id: string
  name: string
  type: ResourceType
  description: string | null
  location: string | null
  quantity: number
  created_at: string
}

export interface Reservation {
  id: string
  resource_id: string
  user_id: string
  start_time: string
  end_time: string
  status: ReservationStatus
  created_at: string
  // Joined relations (optional — only present when explicitly selected)
  resource?: Resource
  profile?: Pick<Profile, 'id' | 'display_name' | 'email'>
}

// Form types
export interface ResourceFormData {
  name: string
  type: ResourceType
  description: string
  location: string
  quantity: number
}

export interface ReservationFormData {
  start_time: string
  end_time: string
}

// Type label maps shared across components
export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  classroom: 'Učebna',
  laptop: 'Notebook',
  projector: 'Projektor',
  camera: 'Kamera',
  other: 'Ostatní',
}

export const RESOURCE_TYPE_ICONS: Record<ResourceType, string> = {
  classroom: 'heroicons:building-library',
  laptop: 'heroicons:computer-desktop',
  projector: 'heroicons:presentation-chart-bar',
  camera: 'heroicons:camera',
  other: 'heroicons:cube',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Student',
  teacher: 'Učitel',
  admin: 'Admin',
}
