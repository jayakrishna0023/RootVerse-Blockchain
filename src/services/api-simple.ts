import axios from 'axios'

// Use environment variable for API URL (supports local dev and production)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8005'

console.log('🔗 API Base URL:', API_BASE_URL)

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Keep API responsive; fail fast in offline mode
  timeout: 15000, // Increased timeout for remote servers
})

// Product Types
export interface Product {
  id: number
  batch_id: string
  product_name: string
  product_type: string
  catch_location: string
  catch_date: string
  fishing_method: string
  vessel_name: string
  fisher_name: string
  // New authenticity + linkage fields
  fisher_id?: string
  home_port_latitude?: number
  home_port_longitude?: number
  vessel_capacity_tons?: number
  trip_id?: string
  geo_json?: any
  processing_facility: string
  processing_date: string
  expiry_date: string
  weight: number
  price: number
  quality_grade: string
  sustainability_cert: string
  blockchain_hash: string
  block_number: number
  vechain_block_id: string
  gas_used: number
  created_at: string
  qr_code_url: string
  // Extended fields
  packaging_type?: string
  storage_temperature?: string
  storage_temperature_c?: number
  cold_chain_required?: boolean
  catch_zone?: string
  water_depth_m?: number
  water_temperature_c?: number
  vessel_image_url?: string
}

export interface ProductCreate {
  product_name: string
  product_type: string
  catch_location: string
  catch_date: string
  fishing_method: string
  vessel_name: string
  fisher_name: string
  fisher_id?: string
  processing_facility: string
  processing_date: string
  expiry_date: string
  weight: number
  price: number
  quality_grade: string
  sustainability_cert: string
  // Extended authenticity fields (optional)
  home_port_latitude?: number
  home_port_longitude?: number
  vessel_capacity_tons?: number
  trip_id?: string
  geo_json?: any
}

// Frontend form interface that matches the UI
export interface ProductFormData {
  productName: string
  productType: string
  catchLocation: string
  catchDate: string
  fishingMethod: string
  vesselName: string
  fisherName: string
  fisherId?: string
  processingFacility: string
  processingDate: string
  expiryDate: string
  weight: number | string
  price: number | string
  qualityGrade: string
  sustainabilityCert: string
  // New authenticity vessel detail fields
  homePortLatitude?: string // capture as string then parse
  homePortLongitude?: string
  vesselCapacityTons?: string
  tripId?: string
  geoJson?: string
  vessel_id?: string
  // Advanced quality & testing
  moistureContent?: string
  phLevel?: string
  nutritionalData?: string // JSON string
  histamineTestResult?: string
  histamineTestDate?: string
  heavyMetalsTest?: string
  labTestReportUrl?: string
  microbialTest?: string
  // Storage & logistics
  storageConditions?: string
  packagingType?: string
  packagingDate?: string
  shelfLifeDays?: string
  storageTemperature?: string
  coldChainRequired?: boolean
  // Traceability
  traceabilityCode?: string
  foodSafetyCert?: string
  exportLicense?: string
  fssaiLicense?: string
  // Sustainability
  sustainabilityScore?: string
  carbonFootprintKg?: string
  fuelUsageLiters?: string
  bycatchRatio?: string
  renewableEnergyUsed?: string
  wasteRecycledPct?: string
  // Social impact
  fairTradeCertified?: boolean
  fairPricePremiumPct?: string
  crewEmployed?: string
  womenWorkersPct?: string
  socialImpactScore?: string
  communityInvestmentInr?: string
  // Advanced Catch Data
  catchZone?: string
  waterDepth?: string
  waterTemperature?: string
}

// Fisher profile & reviews (frontend interfaces)
export interface FisherProfilePublic {
  fisher_id: string
  full_name: string
  bio?: string
  years_experience?: number
  certifications?: string[]
  home_port_latitude?: number
  home_port_longitude?: number
  vessel_capacity_tons?: number
  average_rating?: number
  total_reviews?: number
  home_port_coordinates?: any
}

export interface FisherReviewCreate {
  fisher_id: string
  product_batch_id?: string
  rating: number
  title?: string
  review_text: string
}

export interface FisherReview extends FisherReviewCreate {
  id: number
  reviewer_role?: string
  created_at: string
}

export interface BlockchainTransaction {
  transaction_hash: string
  block_number: number
  batch_id: string
  transaction_type: string
  gas_used: number
  timestamp: string
  explorer_url: string
}

export interface SystemStats {
  total_products: number
  total_blockchain_transactions: number
  recent_products: number
  blockchain_network: string
  system_status: string
}

// Catch entry recorded by fishers (frontend representation)
export interface CatchEntry {
  id: string
  fisher_id: string
  species: string
  weight_kg: number
  catch_month: string
  catch_date?: string
  trip_id?: string
  catch_coordinates?: string
  depth_m?: number
  water_temp_c?: number
  sea_state?: string
  processing_method?: string
  processing_facility?: string
  processing_date?: string
  processing_duration_days?: number
  storage_location?: string
  storage_conditions?: string
  storage_temperature?: string
  storage_duration_days?: number
  quality_grade?: string
  moisture_content?: number
  quality_notes?: string
  notes?: string
  photos_urls?: string[]
  created_at: string
  updated_at?: string
}

export interface Story {
  id: string
  fisher_id: string
  title?: string
  content?: string
  is_public?: boolean
  species?: string
  variety?: string
  gear_type?: string
  is_sustainable?: boolean
  weight_kg?: number
  catch_month?: string
  catch_date?: string
  fishing_method?: string
  trip_id?: string
  catch_coordinates?: string
  depth_m?: number
  water_temp_c?: number
  sea_state?: string
  processing_method?: string
  processing_facility?: string
  processing_date?: string
  processing_duration_days?: number
  storage_location?: string
  storage_conditions?: string
  storage_temperature?: string
  storage_duration_days?: number
  quality_grade?: string
  moisture_content?: number
  quality_notes?: string
  bait_type?: string
  bycatch_mitigation?: string
  practices?: string[]
  certifications?: string[]
  buyer_name?: string
  sale_price_inr?: number
  sale_price_unit?: string
  sale_quantity_kg?: number
  sale_date?: string
  destination_market?: string
  photos_urls?: string[]
  tags?: string[]
  cover_image_url?: string
  vessel_details?: {
    length_m?: number
    tonnage?: number
    engine_hp?: number
    crew_size?: number
  }
  trip_events?: Array<{
    date?: string
    event?: string
    location?: string
    notes?: string
  }>
  processing_steps?: Array<{
    step?: string
    date?: string
    details?: string
    duration_hours?: number
  }>
  created_at: string
  updated_at?: string
}

// API Functions
export const productAPI = {
  // Transform frontend form data to backend format
  transformFormData: (formData: ProductFormData): ProductCreate => {
    const geoJsonParsed = (() => {
      if (!formData.geoJson) return undefined
      try { return JSON.parse(formData.geoJson) } catch { return formData.geoJson }
    })()
    const nutritionalParsed = (() => {
      if (!formData.nutritionalData) return undefined
      try { return JSON.parse(formData.nutritionalData) } catch { return formData.nutritionalData }
    })()
    return {
      product_name: formData.productName,
      product_type: formData.productType,
      catch_location: formData.catchLocation,
      catch_date: formData.catchDate,
      fishing_method: formData.fishingMethod,
      vessel_name: formData.vesselName,
      fisher_name: formData.fisherName,
      fisher_id: formData.fisherId,
      processing_facility: formData.processingFacility,
      processing_date: formData.processingDate,
      expiry_date: formData.expiryDate,
      weight: typeof formData.weight === 'string' ? (formData.weight === '' ? 0 : parseFloat(formData.weight)) : formData.weight,
      price: typeof formData.price === 'string' ? (formData.price === '' ? 0 : parseFloat(formData.price)) : formData.price,
      quality_grade: formData.qualityGrade,
      sustainability_cert: formData.sustainabilityCert,
      home_port_latitude: formData.homePortLatitude ? parseFloat(formData.homePortLatitude) : undefined,
      home_port_longitude: formData.homePortLongitude ? parseFloat(formData.homePortLongitude) : undefined,
      vessel_capacity_tons: formData.vesselCapacityTons ? parseInt(formData.vesselCapacityTons) : undefined,
      trip_id: formData.tripId,
      geo_json: geoJsonParsed,
      // Advanced fields (optional)
      catch_zone: formData.catchZone,
      vessel_id: formData.vessel_id,
      water_depth_m: formData.waterDepth ? parseFloat(formData.waterDepth) : undefined,
      water_temperature_c: formData.waterTemperature ? parseFloat(formData.waterTemperature) : undefined,
      storage_temperature_c: formData.storageTemperature ? parseFloat(formData.storageTemperature) : undefined,
      moisture_content: formData.moistureContent ? parseFloat(formData.moistureContent) : undefined,
      ph_level: formData.phLevel ? parseFloat(formData.phLevel) : undefined,
      nutritional_data: nutritionalParsed,
      histamine_test_result: formData.histamineTestResult,
      heavy_metals_test: formData.heavyMetalsTest,
      lab_test_report_url: formData.labTestReportUrl,
      storage_conditions: formData.storageConditions,
      packaging_type: formData.packagingType,
      shelf_life_days: formData.shelfLifeDays ? parseInt(formData.shelfLifeDays) : undefined,
      cold_chain_required: formData.coldChainRequired,
      traceability_code: formData.traceabilityCode,
      food_safety_cert: formData.foodSafetyCert,
      sustainability_score: formData.sustainabilityScore ? parseFloat(formData.sustainabilityScore) : undefined,
      carbon_footprint_kg: formData.carbonFootprintKg ? parseFloat(formData.carbonFootprintKg) : undefined,
      fuel_usage_liters: formData.fuelUsageLiters ? parseFloat(formData.fuelUsageLiters) : undefined,
      bycatch_ratio: formData.bycatchRatio ? parseFloat(formData.bycatchRatio) : undefined,
      fair_trade_certified: formData.fairTradeCertified,
      workers_employed: formData.crewEmployed ? parseInt(formData.crewEmployed) : undefined,
      social_impact_score: formData.socialImpactScore ? parseFloat(formData.socialImpactScore) : undefined,
      histamine_test_date: formData.histamineTestDate,
    } as any
  },

  // Create new product from form data
  createFromForm: async (formData: ProductFormData): Promise<Product> => {
    const backendData = productAPI.transformFormData(formData)
    const response = await api.post('/api/products', backendData)
    return response.data
  },

  // Create new product
  create: async (productData: ProductCreate): Promise<Product> => {
    const response = await api.post('/api/products', productData)
    return response.data
  },

  // Get all products
  getAll: async (): Promise<Product[]> => {
    const response = await api.get('/api/products')
    return response.data
  },

  // Get products by fisher ID
  listByFisher: async (fisherId: string): Promise<Product[]> => {
    const response = await api.get('/api/products', { params: { fisher_id: fisherId } })
    return response.data
  },

  // Get product by batch ID
  getByBatchId: async (batchId: string): Promise<Product> => {
    const response = await api.get(`/api/products/${batchId}`)
    return response.data
  },

  // Verify product (for verification page)
  verify: async (batchId: string): Promise<any> => {
    const response = await api.get(`/verify/${batchId}`)
    return response.data
  },

  // Upload media for product
  uploadMedia: async (batchId: string, file: File, vesselName?: string): Promise<{url: string}> => {
    const form = new FormData()
    form.append('file', file)
    if (vesselName) {
      form.append('vessel_name', vesselName)
    }
    const response = await api.post(`/api/products/${batchId}/media`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}

export const blockchainAPI = {
  // Get blockchain transaction
  getTransaction: async (batchId: string): Promise<BlockchainTransaction> => {
    const response = await api.get(`/api/blockchain/${batchId}`)
    return response.data
  },
}

export const qrAPI = {
  // Get QR code URL
  getQRCodeUrl: (batchId: string): string => {
    return `${API_BASE_URL}/api/qr/${batchId}/image`
  },

  // Get QR code metadata
  getQRMetadata: async (batchId: string): Promise<any> => {
    const response = await api.get(`/api/qr/${batchId}`)
    return response.data
  },

  // Download QR code
  downloadQRCode: async (batchId: string): Promise<Blob> => {
    const response = await api.get(`/api/qr/${batchId}/image`, {
      responseType: 'blob',
    })
    return response.data
  },
}

export const systemAPI = {
  // Get system statistics
  getStats: async (): Promise<SystemStats> => {
    const response = await api.get('/api/stats')
    return response.data
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; service: string }> => {
    const response = await api.get('/health')
    return response.data
  },
}

// Fisher profile & review APIs (placeholders - backend must implement endpoints)
export const fisherAPI = {
  getProfile: async (fisherId: string): Promise<FisherProfilePublic> => {
    const response = await api.get(`/api/fishers/${fisherId}`)
    return response.data
  },
  getReviews: async (fisherId: string): Promise<FisherReview[]> => {
    const response = await api.get(`/api/fishers/${fisherId}/reviews`)
    return response.data
  },
  getHistory: async (fisherId: string): Promise<any | null> => {
    try {
      const response = await api.get(`/api/fishers/${fisherId}/history`)
      return response.data?.history || null
    } catch {
      try {
        const raw = localStorage.getItem(`fisher_history:${fisherId}`)
        return raw ? JSON.parse(raw) : null
      } catch { return null }
    }
  },
  upsertHistory: async (fisherId: string, history: any): Promise<any> => {
    try {
      const response = await api.put(`/api/fishers/${fisherId}/history`, history)
      return response.data.history
    } catch (e) {
      // Fallback: persist locally
      try { localStorage.setItem(`fisher_history:${fisherId}`, JSON.stringify(history)) } catch {}
      return history
    }
  },
  appendTimelineEvent: async (fisherId: string, event: {date: string; event: string; details?: string}): Promise<any> => {
    try {
      const response = await api.post(`/api/fishers/${fisherId}/history/timeline`, event)
      return response.data.history
    } catch {
      // Local fallback
      try {
        const key = `fisher_history:${fisherId}`
        const raw = localStorage.getItem(key)
        const obj = raw ? JSON.parse(raw) : { timeline: [] }
        obj.timeline = obj.timeline || []
        obj.timeline.push(event)
        localStorage.setItem(key, JSON.stringify(obj))
        return obj
      } catch { return null }
    }
  },
  // Get catches for a fisher. Falls back to localStorage if backend not available.
  getCatches: async (fisherId: string): Promise<CatchEntry[]> => {
    try {
      const response = await api.get(`/api/fishers/${fisherId}/catches`)
      return response.data
    } catch (err) {
      // localStorage fallback
      try {
        const raw = localStorage.getItem(`fisher_catches:${fisherId}`)
        return raw ? JSON.parse(raw) : []
      } catch { return [] }
    }
  },
  // Create a catch entry (tries backend then falls back to localStorage)
  createCatch: async (entry: CatchEntry): Promise<CatchEntry> => {
    try {
      const response = await api.post(`/api/fishers/${entry.fisher_id}/catches`, entry)
      return response.data
    } catch (err) {
      try {
        const key = `fisher_catches:${entry.fisher_id}`
        const prev = localStorage.getItem(key)
        const list = prev ? JSON.parse(prev) : []
        list.unshift(entry)
        localStorage.setItem(key, JSON.stringify(list))
      } catch {}
      return entry
    }
  },
  // Update a catch entry
  updateCatch: async (fisherId: string, catchId: string, updates: Partial<CatchEntry>): Promise<CatchEntry> => {
    try {
      const response = await api.put(`/api/fishers/${fisherId}/catches/${catchId}`, updates)
      return response.data
    } catch (err) {
      // localStorage fallback
      try {
        const key = `fisher_catches:${fisherId}`
        const raw = localStorage.getItem(key)
        const list: CatchEntry[] = raw ? JSON.parse(raw) : []
        const idx = list.findIndex(y => y.id === catchId)
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() }
          localStorage.setItem(key, JSON.stringify(list))
          return list[idx]
        }
      } catch {}
      throw new Error('Could not update catch')
    }
  },
  // Delete a catch entry
  deleteCatch: async (fisherId: string, catchId: string): Promise<void> => {
    try {
      await api.delete(`/api/fishers/${fisherId}/catches/${catchId}`)
    } catch (err) {
      // localStorage fallback
      try {
        const key = `fisher_catches:${fisherId}`
        const raw = localStorage.getItem(key)
        const list: CatchEntry[] = raw ? JSON.parse(raw) : []
        const filtered = list.filter(y => y.id !== catchId)
        localStorage.setItem(key, JSON.stringify(filtered))
      } catch {}
    }
  }
}

// Fisher Data API (aliases Story API with data-first endpoints and graceful fallback)
export type FisherData = Story

export const fisherDataAPI = {
  listByFisher: async (fisherId: string, publicOnly = false): Promise<FisherData[]> => {
    try {
      const res = await api.get(`/api/fishers/${fisherId}/data`, { params: { public_only: publicOnly } })
      return res.data
    } catch (e1) {
      try {
        const response = await api.get(`/api/fishers/${fisherId}/stories`, { params: { public_only: publicOnly } })
        return response.data
      } catch (e2) {
        // Local fallback
        try {
          localStorage.setItem('fd_offline', '1')
        } catch {}
        try {
          const raw = localStorage.getItem(`fisher_data:${fisherId}`)
          return raw ? JSON.parse(raw) : []
        } catch {
          return []
        }
      }
    }
  },
  getById: async (fisherId: string, recordId: string): Promise<FisherData> => {
    try {
      const res = await api.get(`/api/fishers/${fisherId}/data/${recordId}`)
      return res.data
    } catch (e1) {
      try {
        const response = await api.get(`/api/fishers/${fisherId}/stories/${recordId}`)
        return response.data
      } catch (e2) {
        console.error('Failed to load record from backend:', e2);
        throw new Error('Record not found in database');
      }
    }
  },
  create: async (fisherId: string, data: Partial<FisherData>): Promise<FisherData> => {
    const withOwner = { ...data, fisher_id: fisherId }
    try {
      const res = await api.post(`/api/fishers/${fisherId}/data`, withOwner)
      return res.data
    } catch (e1) {
      try {
        const response = await api.post(`/api/fishers/${fisherId}/stories`, withOwner)
        return response.data
      } catch (e2) {
        console.error('Failed to create record in backend:', e2);
        throw new Error('Failed to create record');
      }
    }
  },
  update: async (fisherId: string, recordId: string, updates: Partial<FisherData>): Promise<FisherData> => {
    try {
      const res = await api.put(`/api/fishers/${fisherId}/data/${recordId}`, updates)
      return res.data
    } catch (e1) {
      try {
        const response = await api.put(`/api/fishers/${fisherId}/stories/${recordId}`, updates)
        return response.data
      } catch (e2) {
        console.error('Failed to update record in backend:', e2);
        throw new Error('Failed to update record');
      }
    }
  },
  remove: async (fisherId: string, recordId: string): Promise<void> => {
    try {
      await api.delete(`/api/fishers/${fisherId}/data/${recordId}`)
    } catch (e1) {
      try {
        await api.delete(`/api/fishers/${fisherId}/stories/${recordId}`)
      } catch (e2) {
        console.error('Failed to delete record from backend:', e2);
        throw new Error('Failed to delete record');
      }
    }
  },
  listPublic: async (limit = 50): Promise<FisherData[]> => {
    try {
      const res = await api.get('/api/fisher-data/public', { params: { limit } })
      return res.data
    } catch (e1) {
      try {
        const response = await api.get('/api/stories/public', { params: { limit } })
        return response.data
      } catch (e2) {
        console.error('Failed to load public records from backend:', e2);
        return [];
      }
    }
  },
  uploadMedia: async (fisherId: string, recordId: string, file: File): Promise<{url: string}> => {
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await api.post(`/api/fishers/${fisherId}/data/${recordId}/media`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      return res.data
    } catch {
      const response = await api.post(`/api/fishers/${fisherId}/stories/${recordId}/media`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      return response.data
    }
  },
  aiParse: async (text: string): Promise<{data: Partial<FisherData>}> => {
    try {
      const res = await api.post('/api/ai/fisher-data/parse', { text })
      return res.data
    } catch {
      const response = await api.post('/api/ai/stories/parse', { text })
      return response.data
    }
  },
}

export const storyAPI = {
  listByFisher: async (fisherId: string, publicOnly = false): Promise<Story[]> => {
    const response = await api.get(`/api/fishers/${fisherId}/stories`, { params: { public_only: publicOnly } })
    return response.data
  },
  getById: async (fisherId: string, postId: string): Promise<Story> => {
    const response = await api.get(`/api/fishers/${fisherId}/stories/${postId}`)
    return response.data
  },
  create: async (fisherId: string, post: Partial<Story>): Promise<Story> => {
    const response = await api.post(`/api/fishers/${fisherId}/stories`, post)
    return response.data
  },
  update: async (fisherId: string, postId: string, updates: Partial<Story>): Promise<Story> => {
    const response = await api.put(`/api/fishers/${fisherId}/stories/${postId}`, updates)
    return response.data
  },
  remove: async (fisherId: string, postId: string): Promise<void> => {
    await api.delete(`/api/fishers/${fisherId}/stories/${postId}`)
  },
  listPublic: async (limit = 50): Promise<Story[]> => {
    const response = await api.get('/api/stories/public', { params: { limit } })
    return response.data
  },
  uploadMedia: async (fisherId: string, postId: string, file: File): Promise<{url: string}> => {
    const form = new FormData()
    form.append('file', file)
    const response = await api.post(`/api/fishers/${fisherId}/stories/${postId}/media`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
  aiParse: async (text: string): Promise<{data: Partial<Story>}> => {
    const response = await api.post('/api/ai/stories/parse', { text })
    return response.data
  },
}

export const reviewAPI = {
  create: async (data: FisherReviewCreate): Promise<FisherReview> => {
    const response = await api.post('/api/reviews', data)
    return response.data
  },
}

export default api
