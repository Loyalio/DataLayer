import type { Context } from "hono"

export function handlePing(c: Context) {
  return c.json({ status: "ok" }, 202)
}
