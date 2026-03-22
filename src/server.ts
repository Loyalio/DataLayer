import "dotenv/config"
import { serve } from "@hono/node-server"
import { createApp } from "./app.js"
import { getClient } from "./db/client.js"
import { startStatusMonitor } from "./dev/status.js"

const port = Number(process.env.PORT) || 2790
const isDev = process.env.NODE_ENV !== "production"
const app = createApp()

if (isDev) {
  getClient().catch(() => {})
  startStatusMonitor(1000)
}

serve(
  {
    fetch: app.fetch,
    port,
  },
)
