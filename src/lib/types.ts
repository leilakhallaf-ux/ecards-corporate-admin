export interface ECard {
  id: string
  advertiser_name: string | null
  advertiser_logo_url: string | null
  business_sector: string | null
  vintage: number | null
  language: string | null
  card_type: string | null
  version: string | null
  topic: string | null
  technology: string | null
  distributor: string | null
  tags: string[] | null
  url: string | null
  fallback_url: string | null
  swf_url: string | null
  is_hosted: boolean
  file_path: string | null
  campaign_aim: string | null
  target_audience: string | null
  key_message: string | null
  tone: string | null
  submitted_by: string | null
  submitted_capacity: string | null
  agency: string | null
  credits: Record<string, unknown> | null
  description: string | null
  views: number
  likes: number
  score_avg: number | null
  score_count: number | null
  admin_score: number | null
  created_at: string
  updated_at: string
  is_published: boolean
  is_featured: boolean
  thumbnail_url: string | null
    video_url: string | null
}

export interface ECardVariant {
  id: string
  ecard_id: string
  label: string
  url: string | null
  variant_type: 'web' | 'mobile' | 'email' | 'anglaise' | 'autre'
  language: string
  sort_order: number
  created_at: string
}

export const VARIANT_TYPES = [
  { value: 'anglaise', label: 'Version anglaise' },
  { value: 'mobile', label: 'Version mobile' },
  { value: 'email', label: "E-mail d'alerte" },
  { value: 'autre', label: 'Autre' },
]

export interface ECardSubmission {
  id: string
  advertiser_name: string
  business_sector: string
  card_type: string
  language: string
  submitted_by: string
  submitted_capacity: string
  agency: string | null
  description: string | null
  file_url: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface AdminUser {
  id: string
  email: string
  created_at: string
  created_by: string | null
}

export interface Language {
  code: string
  name: string
  is_default: boolean
  is_active: boolean
}

export interface TranslationKey {
  id: string
  key: string
  context: string | null
}

export interface Translation {
  id: string
  key_id: string
  language_code: string
  value: string
}

export interface TranslationWithRelations {
  id: string
  key: string
  translations: Array<{
    text: string
    languages: {
      code: string
    }
  }>
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: 'new' | 'read' | 'replied'
  created_at: string
}

export interface DashboardStats {
  totalECards: number
  totalViews: number
  totalLikes: number
  newMessages: number
  cardsWithScore: number
  totalRatings: number
  avgScore: number
}
