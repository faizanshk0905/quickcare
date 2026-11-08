import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import http from 'node:http'
import { spawn } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function autoBackendPlugin() {
  let attempted = false
  return {
    name: 'auto-backend-starter',
    configureServer() {
      if (attempted) return
      attempted = true

      const checkReq = http.get('http://127.0.0.1:8080/swagger-ui.html', () => {
        // Backend is already running
      })

      checkReq.on('error', () => {
        const jarPath = path.resolve(__dirname, '../backend/target/quickcare-backend-1.0.0.jar')
        if (fs.existsSync(jarPath)) {
          const javaPaths = [
            'C:\\tools\\jdk17\\bin\\java.exe',
            process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin', 'java.exe') : null,
            'java'
          ].filter(Boolean)

          for (const javaBin of javaPaths) {
            try {
              if (javaBin.includes('\\') && !fs.existsSync(javaBin)) continue
              const child = spawn(javaBin, ['-jar', jarPath], {
                detached: true,
                stdio: 'ignore',
                windowsHide: true,
              })
              child.unref()
              console.log(`\n\x1b[32m✔ [QuickCare] Spring Boot backend auto-started in background on port 8080.\x1b[0m\n`)
              break
            } catch (err) {
              // try next
            }
          }
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), autoBackendPlugin()],
  server: {
    host: true, // Listens on all local IP addresses for live mobile device testing
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
