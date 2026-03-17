import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const customer = process.env.VITE_CUSTOMER || 'autoshop'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@customer': resolve(__dirname, `src/customers/${customer}`)
    }
  }
})
