import { createBrowserRouter } from 'react-router-dom'
import Editor from '@/pages/Editor'
import Dashboard from '@/pages/Dashboard'
import Auth from '@/pages/Auth'
import ProtectedRoute from '@/components/ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <Auth />,
  },
  {
    path: '/',
    element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
  },
  {
    path: '/editor/:projectId',
    element: <ProtectedRoute><Editor /></ProtectedRoute>,
  },
])
