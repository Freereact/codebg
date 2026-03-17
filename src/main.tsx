import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RootLayout } from './components/layout/root-layout'
import { HomePage } from './pages/home-page'
import { NewsArticlePage } from './pages/news-article'
import { ServicePage } from './pages/service-page'
import { NewsIndexPage } from './pages/news-index'
import { CustomersIndexPage } from './pages/customers-index'
import { NotFoundPage } from './pages/not-found'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/news" element={<NewsIndexPage />} />
          <Route path="/news/:slug" element={<NewsArticlePage />} />
          <Route path="/customers" element={<CustomersIndexPage />} />
          <Route path="/services/:slug" element={<ServicePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
