import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import { NewsArticlePage } from './pages/news-article'
import { ServicePage } from './pages/service-page'
import { NotFoundPage } from './pages/not-found'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/news/:slug" element={<NewsArticlePage />} />
        <Route path="/services/:slug" element={<ServicePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
