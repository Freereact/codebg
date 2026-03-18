import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/auth-context'
import { RootLayout } from './components/layout/root-layout'
// AuthLayout kept for future protected dashboard routes
// import { AuthLayout } from './components/layout/auth-layout'
import { HomePage } from './pages/home-page'
import { AboutPage } from './pages/about-page'
import { ServicesIndexPage } from './pages/services-index'
import { ProcessPage } from './pages/process-page'
import { PricingPage } from './pages/pricing-page'
import { NewsArticlePage } from './pages/news-article'
import { ServicePage } from './pages/service-page'
import { NewsIndexPage } from './pages/news-index'
import { CustomersIndexPage } from './pages/customers-index'
import { LoginPage } from './pages/login-page'
import { VerifyPage } from './pages/verify-page'
import { NotFoundPage } from './pages/not-found'
import './index.css'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/services" element={<ServicesIndexPage />} />
            <Route path="/process" element={<ProcessPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/news" element={<NewsIndexPage />} />
            <Route path="/news/:slug" element={<NewsArticlePage />} />
            <Route path="/customers" element={<CustomersIndexPage />} />
            <Route path="/services/:slug" element={<ServicePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify" element={<VerifyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
