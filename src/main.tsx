import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/theme-context'
import { AuthProvider } from './contexts/auth-context'
import { SiteModeProvider } from './contexts/site-mode-context'
import { RootLayout } from './components/layout/root-layout'
import { PortalLayout } from './components/layout/portal-layout'
import { RequireAuth } from './components/auth/require-auth'
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
import { PortalDashboardPage } from './pages/portal-dashboard'
import { NewProjectPage } from './pages/new-project'
import { ProjectReviewPage } from './pages/project-review'
import { PortalSettingsPage } from './pages/portal-settings'
import { ProjectDetailPage } from './pages/project-detail'
import { AdminLayout } from './components/layout/admin-layout'
import { RequireAdmin } from './components/auth/require-admin'
import { AdminDashboardPage } from './pages/admin/admin-dashboard'
import { AdminProjectsPage } from './pages/admin/admin-projects'
import { AdminProjectDetailPage } from './pages/admin/admin-project-detail'
import { AdminUsersPage } from './pages/admin/admin-users'
import { AdminFeedbackPage } from './pages/admin/admin-feedback'
import { NotFoundPage } from './pages/not-found'
import { ErrorBoundary } from './components/ui/error-boundary'
import { IS_TEST } from './lib/config'
import './index.css'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <ThemeProvider>
          <SiteModeProvider>
            <AuthProvider>
              <Routes>
                {/* Marketing site */}
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

                {/* Customer portal (authenticated) */}
                <Route
                  element={
                    <RequireAuth>
                      <PortalLayout />
                    </RequireAuth>
                  }
                >
                  <Route path="/portal" element={<Navigate to="/portal/dashboard" replace />} />
                  <Route path="/portal/dashboard" element={<PortalDashboardPage />} />
                  <Route path="/portal/projects/new" element={<NewProjectPage />} />
                  <Route path="/portal/projects/:id" element={<ProjectDetailPage />} />
                  <Route path="/portal/projects/:id/review" element={<ProjectReviewPage />} />
                  <Route path="/portal/settings" element={<PortalSettingsPage />} />
                </Route>

                {/* Admin portal (admin role only) */}
                <Route
                  element={
                    <RequireAdmin>
                      <AdminLayout />
                    </RequireAdmin>
                  }
                >
                  <Route path="/admin" element={<AdminDashboardPage />} />
                  <Route path="/admin/projects" element={<AdminProjectsPage />} />
                  <Route path="/admin/projects/:id" element={<AdminProjectDetailPage />} />
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
                </Route>
              </Routes>
            </AuthProvider>
          </SiteModeProvider>
        </ThemeProvider>
      </ErrorBoundary>
      {IS_TEST && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-amber-500 py-1 text-center text-xs font-semibold text-black">
          Test Environment — data may be reset at any time
        </div>
      )}
    </BrowserRouter>
  </React.StrictMode>,
)
