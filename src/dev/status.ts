import chalk from "chalk"
import logUpdate from "log-update"
import { connectionStatus } from "../db/client.js"

const port = Number(process.env.PORT) || 2790

let requestCount = 0
const startTime = Date.now()

export function incrementRequests() {
  requestCount++
}

export function getRequestCount() {
  return requestCount
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const ss = s % 60
  if (m < 60) return `${m}m ${ss}s`
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${h}h ${mm}m`
}

function renderStatus(): string {
  const mongo = connectionStatus.ok
    ? chalk.green("● connected")
    : chalk.red("○ disconnected")
  const uptime = chalk.yellow(formatUptime(Date.now() - startTime))
  const reqs = chalk.magenta(`${requestCount} req`)
  const time = chalk.dim(`[${new Date().toLocaleTimeString()}]`)
  const sep = chalk.cyan("│")
  return chalk.bgBlue(` ${time} ${chalk.bold("MongoDB")} ${mongo} ${sep} ${reqs} ${sep} ${uptime} `)
}

export function writeStatus() {
  const banner = chalk.bgGreenBright(` ${chalk.bold("Made by Loyalio for MongoDB Community")} `)
  logUpdate(`${banner}\n${renderStatus()} \n${chalk.bold(`Loyalio Data API on ${chalk.green("POST")} http://localhost:${port}/v1/data`)}`)
}

export function clearAndPersist(line: string) {
  logUpdate.clear()
  process.stdout.write(line + "\n")
}

export function startStatusMonitor(intervalMs = 2000) {
  process.stdout.write("\n")
  writeStatus()
  const id = setInterval(writeStatus, intervalMs)
  return () => clearInterval(id)
}
