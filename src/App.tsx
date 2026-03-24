import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ECards from './pages/ECards'
import ECardEdit from './pages/ECardEdit'
import Submissions from './pages/Submissions'
import SubmissionDetail from './pages/SubmissionDetail'
import Users from './pages/Users'
import Translations from './pages/Translations'
import Messages from './pages/Messages'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ecards"
          element={
            <ProtectedRoute>
              <Layout>
                <ECards />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ecards/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ECardEdit />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/submissions"
          element={
            <ProtectedRoute>
              <Layout>
                <Submissions />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/submissions/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <SubmissionDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/translations"
          element={
            <ProtectedRoute>
              <Layout>
                <Translations />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Layout>
                <Messages />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
