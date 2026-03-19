import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const customer = process.env.VITE_CUSTOMER || 'autoshop'
// Support absolute paths for project workspaces (e.g., /var/www/projects/<id>)
const customerPath = customer.startsWith('/') ? customer : resolve(__dirname, `src/customers/${customer}`)

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@customer': customerPath
    }
  }
})
