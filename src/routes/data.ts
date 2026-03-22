import type { Context } from "hono"
import { mongodb } from "../db/index.js"

type Body = {
  action?: string
  payload?: Record<string, unknown>
  overrides?: { database?: string; collection?: string }
}

export async function handleDataRequest(c: Context): Promise<Response> {
  const isOffline = process.env.IS_OFFLINE === "true"
  if (!isOffline) {
    const incomingKey = c.req.header("service-cred")
    const expectedKey = process.env.MONGODB_API_KEY
    if (incomingKey !== expectedKey) {
      return c.json({ error: "Forbidden" }, 403)
    }
  }
  let body: Body
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400)
  }
  const { action, payload = {}, overrides } = body
  if (!action) {
    return c.json({ error: "Missing action" }, 400)
  }
  try {
    const result = await executeAction(action, payload, overrides)
    if (result === null) {
      return c.json({ error: "Unsupported action" }, 400)
    }
    return c.json(result)
  } catch (err) {
    console.error("[data-layer]", err)
    return c.json({ error: (err as Error).message }, 500)
  }
}

async function executeAction(
  action: string,
  payload: Record<string, unknown>,
  overrides?: { database?: string; collection?: string }
): Promise<unknown> {
  switch (action) {
    case "aggregate":
      return mongodb.aggregate({ pipeline: (payload.pipeline as object[]) || [] }, overrides)
    case "deleteOne":
      return mongodb.deleteOne({ filter: (payload.filter as object) || {} }, overrides)
    case "deleteMany":
      return mongodb.deleteMany({ filter: (payload.filter as object) || {} }, overrides)
    case "find":
      return mongodb.find(
        {
          filter: payload.filter as object,
          projection: payload.projection as object,
          sort: payload.sort as object,
          limit: payload.limit as number,
          skip: payload.skip as number,
        },
        overrides
      )
    case "findOne":
      return mongodb.findOne(
        {
          filter: payload.filter as object,
          projection: payload.projection as object,
        },
        overrides
      )
    case "insertOne":
      return mongodb.insertOne({ document: (payload.document as object) || {} }, overrides)
    case "insertMany":
      return mongodb.insertMany({ documents: (payload.documents as object[]) || [] }, overrides)
    case "replaceOne":
      return mongodb.replaceOne(
        {
          filter: (payload.filter as object) || {},
          replacement: (payload.replacement as object) || {},
          upsert: payload.upsert as boolean,
        },
        overrides
      )
    case "updateOne":
      return mongodb.updateOne(
        {
          filter: (payload.filter as object) || {},
          update: (payload.update as object) || {},
          upsert: payload.upsert as boolean,
        },
        overrides
      )
    case "updateMany":
      return mongodb.updateMany(
        {
          filter: (payload.filter as object) || {},
          update: (payload.update as object) || {},
          upsert: payload.upsert as boolean,
        },
        overrides
      )
    default:
      return null
  }
}
