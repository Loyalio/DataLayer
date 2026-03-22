import chalk from "chalk"
import type { Context, Next } from "hono"
import { clearAndPersist, incrementRequests, writeStatus } from "./status.js"

function colorStatus(status: number) {
  if (status >= 200 && status < 300) return chalk.green(status)
  if (status >= 400) return chalk.red(status)
  return chalk.yellow(status)
}

export async function devLogger(c: Context, next: Next) {
  const start = Date.now()
  const method = c.req.method
  const path = new URL(c.req.url).pathname || "/"
  await next()
  const status = c.res.status
  const ms = Date.now() - start
  incrementRequests()
  const time = new Date().toLocaleTimeString()
  const line = chalk.dim(`[${time}]`) + ` ${method} ${path} ` + colorStatus(status) + ` ${ms}ms`
  clearAndPersist(line)
  writeStatus()
}
