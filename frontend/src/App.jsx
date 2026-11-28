import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import LeadDetails from './pages/LeadDetails'
import FollowUps from './pages/FollowUps'
import Pipeline from './pages/Pipeline'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Customers from './pages/Customers'
import DashboardLayout from './components/layout/DashboardLayout'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

// UI-level guard only: the backend's @PreAuthorize("hasRole('MANAGER')") remains the real check.
function ManagerRoute({ children }) {
  const { user } = useAuth()
  return user?.role === 'MANAGER' ? children : <Navigate to="/" replace />
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="leads/:id" element={<LeadDetails />} />
        <Route path="follow-ups" element={<FollowUps />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<ManagerRoute><Users /></ManagerRoute>} />
        <Route path="customers" element={<ManagerRoute><Customers /></ManagerRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
