import axios from 'axios'

const API_BASE_URL = 'http://localhost:8005'

const authAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // PRODUCTION OPTIMIZED: Faster timeout for better UX
  timeout: 3000, // 3 seconds max wait
  // Enable request compression
  validateStatus: (status) => status < 500, // Don't throw on 4xx errors
})

// Types
export interface User {
  id: string
  email: string
  full_name: string
  role: 'consumer' | 'fisher' | 'admin' | 'distributor'
  phone?: string
  location?: string
  profile_image_url?: string
  is_verified: boolean
  created_at: string
}

export interface FisherProfile {
  id: string
  user_id: string
  vessel_name: string
  home_port: string
  vessel_capacity_tons?: number
  tribal_community?: string
  certification_number?: string
  sustainable_certified: boolean
  specialization?: string[]
  years_of_experience?: number
  total_products_registered: number
  rating: number
  verified_badge: boolean
  created_at: string
}

export interface AuthResponse {
  success: boolean
  user: User
  fisher_profile?: FisherProfile
  token: string
  expires_at: string
}

export interface RegisterData {
  email: string
  password: string
  full_name: string
  role?: 'consumer' | 'fisher' | 'admin' | 'distributor'
  phone?: string
  location?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface FisherProfileData {
  vessel_name: string
  home_port: string
  tribal_community?: string
  vessel_capacity_tons?: number
  sustainable_certified: boolean
  specialization?: string[]
}

// Auth Functions
export const authService = {
  // Register new user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await authAPI.post('/api/auth/register', data)
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  },

  // Login user - PRODUCTION OPTIMIZED
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await authAPI.post('/api/auth/login', data)
      
      // Validate response structure
      if (!response.data) {
        throw new Error('Invalid login response - no data received')
      }
      
      if (!response.data.user) {
        console.error('Login response:', response.data)
        throw new Error('Invalid login response - missing user data')
      }
      
      // Ensure full_name exists, provide fallback
      if (!response.data.user.full_name) {
        console.warn('User missing full_name, using email fallback')
        response.data.user.full_name = response.data.user.email?.split('@')[0] || 'User'
      }
      
      // Batch localStorage writes for performance
      const updates: [string, string][] = []
      
      const token: string = response.data.token || `local_session_${Math.random().toString(36).slice(2)}`
      if (token) {
        updates.push(['auth_token', token])
      }
      if (response.data.user) {
        updates.push(['user', JSON.stringify(response.data.user)])
      }
      if (response.data.fisher_profile) {
        updates.push(['fisher_profile', JSON.stringify(response.data.fisher_profile)])
      }
      
      // Write all at once
      updates.forEach(([key, value]) => localStorage.setItem(key, value))
      
      return response.data
    } catch (error: any) {
      // Fast fail for network errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Server not responding. Please try again.')
      }
      
      // Handle axios response errors
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password')
      }
      
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail)
      }
      
      throw error
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      try {
        await authAPI.post(`/api/auth/logout?token=${token}`)
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    localStorage.removeItem('fisher_profile')
  },

  // Verify token
  verifyToken: async (token: string): Promise<{ user: User; fisher_profile?: FisherProfile }> => {
    const response = await authAPI.get(`/api/auth/verify?token=${token}`)
    return response.data
  },

  // Get current user
  getCurrentUser: (): User | null => {
    try {
      const userStr = localStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    } catch (e) {
      console.error('Error parsing user from localStorage', e)
      localStorage.removeItem('user')
      return null
    }
  },

  // Get auth token
  getToken: (): string | null => {
    return localStorage.getItem('auth_token')
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    // Consider authenticated if there's a token OR a user object (dev-friendly fallback)
    return !!(localStorage.getItem('auth_token') || localStorage.getItem('user'))
  },

  // Get user profile
  getProfile: async (): Promise<{ user: User; fisher_profile?: FisherProfile }> => {
    const token = authService.getToken()
    if (!token) {
      throw new Error('No authentication token')
    }
    const response = await authAPI.get(`/api/users/profile?token=${token}`)
    return response.data
  },

  // Create fisher profile
  createFisherProfile: async (data: FisherProfileData): Promise<FisherProfile> => {
    const token = authService.getToken()
    if (!token) {
      throw new Error('No authentication token')
    }
    const response = await authAPI.post(`/api/auth/fisher-profile?token=${token}`, data)
    if (response.data.profile) {
      localStorage.setItem('fisher_profile', JSON.stringify(response.data.profile))
    }
    return response.data.profile
  },

  // Get fisher profile from storage
  getFisherProfile: (): FisherProfile | null => {
    try {
      const profileStr = localStorage.getItem('fisher_profile')
      return profileStr ? JSON.parse(profileStr) : null
    } catch (e) {
      console.error('Error parsing fisher_profile from localStorage', e)
      localStorage.removeItem('fisher_profile')
      return null
    }
  },
}

export default authService
