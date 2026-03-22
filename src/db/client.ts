import { MongoClient, type Collection } from "mongodb"

let client: MongoClient | null = null
let _lastPing = 0

export const connectionStatus = {
  ok: false,
  lastCheck: 0,
}
const PING_INTERVAL_MS = process.env.NODE_ENV === "production" ? 5_000 : 10_000

export async function reconnect(): Promise<MongoClient> {
  if (client) {
    try {
      await client.close()
    } catch {}
    client = null
  }
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/database"
  client = new MongoClient(uri, {
    maxPoolSize: process.env.NODE_ENV === "production" ? 1 : 3,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 5000,
    waitQueueTimeoutMS: 5000,
    heartbeatFrequencyMS: 30000,
    retryWrites: true,
    retryReads: true,
    appName: "foomotion-data-layer",
    driverInfo: { name: "nodejs", version: "7.1.0" },
  })
  await client.connect()
  _lastPing = Date.now()
  connectionStatus.ok = true
  connectionStatus.lastCheck = _lastPing
  const dbName = process.env.MONGODB_DATABASE_NAME || "database"
  try {
    await client.db(dbName).createCollection("_init")
  } catch (e) {
    if ((e as { code?: number }).code !== 48) throw e
  }
  console.log("[data-layer] MongoDB connected")
  return client
}

export function isRecoverableError(err: unknown): boolean {
  const msg = String((err as Error).message || "")
  return (
    msg.includes("PoolClearedError") ||
    msg.includes("connection") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("network") ||
    msg.includes("TopologyDestroyed")
  )
}

export async function getClient(): Promise<MongoClient> {
  if (!client) return reconnect()
  const now = Date.now()
  if (now - _lastPing >= PING_INTERVAL_MS) {
    try {
      await client.db().admin().ping()
      _lastPing = now
      connectionStatus.ok = true
      connectionStatus.lastCheck = now
    } catch {
      connectionStatus.ok = false
      console.log("[data-layer] ping failed, reconnecting…")
      return reconnect()
    }
  }
  return client
}

export async function withReconnect<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (isRecoverableError(err)) {
      connectionStatus.ok = false
      console.log("[data-layer] recoverable error, reconnecting…", (err as Error).message)
      await reconnect()
      return fn()
    }
    throw err
  }
}

export async function getCollection(
  overrides?: { database?: string; collection?: string }
): Promise<Collection> {
  const c = await getClient()
  const db = c.db(overrides?.database || process.env.MONGODB_DATABASE_NAME || "database")
  return db.collection(overrides?.collection || "main")
}
