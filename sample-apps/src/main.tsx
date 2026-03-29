import '@customer/theme.css'
import './base.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { config } from '@customer/config'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App config={config} />
  </StrictMode>
)
