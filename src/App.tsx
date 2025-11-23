import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect, lazy, Suspense } from 'react'
import { authService } from './services/auth'
import ProtectedRoute from './components/ProtectedRoute'
import RouteProgress from './components/RouteProgress'

// PRODUCTION OPTIMIZED: Code splitting for faster initial load
// Public pages - Load immediately
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProductVerifyPage from './pages/ProductVerifyPage'

// Protected pages - Lazy load (only load when needed)
const RoleDashboard = lazy(() => import('./pages/RoleDashboard'))
const DataEntryPage = lazy(() => import('./pages/DataEntryPage'))
const AdminPanelPage = lazy(() => import('./pages/AdminPanelPage'))
const AdminProductDetailPage = lazy(() => import('./pages/AdminProductDetailPage'))
const VeChainBlockVerifyPage = lazy(() => import('./pages/VeChainBlockVerifyPage'))
const FisherProfilePage = lazy(() => import('./pages/FisherProfilePage'))
const FisherStoriesPage = lazy(() => import('./pages/FisherStoriesPage'))
const FisherDataPage = lazy(() => import('./pages/FisherDataPage'))
const FisherDataEditorPage = lazy(() => import('./pages/FisherDataEditorPage'))

// Loading component for suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-600 font-semibold text-lg">Loading...</p>
    </div>
  </div>
)

function App() {
  console.log('🚀 COASTAL FISHERS Blockchain App initializing...')

  // Check authentication on mount
  useEffect(() => {
    const token = authService.getToken();
    const user = authService.getCurrentUser();
    
    if (token && user) {
      console.log('✅ User authenticated:', user.email, '| Role:', user.role);
    } else {
      console.log('⚠️ No active session - showing public landing page');
    }
  }, []);
  
  return (
    <Router>
      <div className="min-h-screen bg-white text-gray-900">
        <RouteProgress />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify" element={<ProductVerifyPage />} />
          <Route path="/product-verify" element={<ProductVerifyPage />} />
          <Route path="/vechain/block/:blockId" element={<VeChainBlockVerifyPage />} />
          <Route path="/fishers/:fisherId" element={<FisherProfilePage />} />
          <Route path="/fisher-stories" element={<FisherStoriesPage />} />
          {/* New Fisher Data routes */}
          <Route 
            path="/fisher-data" 
            element={
              <ProtectedRoute requiredRoles={["fisher"]}>
                <FisherDataPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/fisher/data/new" 
            element={
              <ProtectedRoute requiredRoles={["fisher"]}>
                <FisherDataEditorPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/fisher/data/:id/edit" 
            element={
              <ProtectedRoute requiredRoles={["fisher"]}>
                <FisherDataEditorPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected Routes - Require Authentication */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <RoleDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/data-entry" 
            element={
              <ProtectedRoute requiredRoles={["fisher","admin"]}>
                <DataEntryPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRoles={["fisher","admin","distributor"]}>
                <AdminPanelPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/products/:batchId" 
            element={
              <ProtectedRoute requiredRoles={["admin"]}>
                <AdminProductDetailPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all - redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        
        {/* 🌟 Modern Toast Notifications */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(255, 255, 255, 0.9)',
              color: '#0f172a',
              borderRadius: '12px',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              backdropFilter: 'blur(8px)',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
              zIndex: 9999,
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
              style: {
                borderLeft: '4px solid #10b981',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
              style: {
                borderLeft: '4px solid #ef4444',
              },
            },
            loading: {
              style: {
                borderLeft: '4px solid #0ea5e9',
              },
            },
          }}
        />
      </div>
    </Router>
  )
}

export default App
