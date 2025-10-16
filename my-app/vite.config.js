import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import dotenv from "dotenv"

dotenv.config() // load .env file

// inject process.env.* for frontend
const envWithProcessPrefix = {}
for (const key of Object.keys(process.env)) {
  if (key.startsWith("FIREBASE_")) {
    envWithProcessPrefix[`process.env.${key}`] = JSON.stringify(process.env[key])
  }
}

export default defineConfig({
  plugins: [react()],
  define: envWithProcessPrefix,
})
