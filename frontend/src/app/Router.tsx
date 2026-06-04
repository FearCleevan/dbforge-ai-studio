import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'
import { StudioPage } from '@/pages/StudioPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/studio" element={<Navigate to="/studio/demo-project-ecommerce" replace />} />
        <Route path="/studio/:projectId" element={<StudioPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
