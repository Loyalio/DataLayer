import type { Sort } from "mongodb"
import { getCollection, withReconnect } from "./client.js"
import { cleanMongoUpdate, removeNulls } from "./utils.js"

type Overrides = { database?: string; collection?: string }

export const mongodb = {
  aggregate: async ({ pipeline }: { pipeline: object[] }, overrides?: Overrides) =>
    withReconnect(async () => {
      const collection = await getCollection(overrides)
      return { documents: await collection.aggregate(pipeline).toArray() }
    }),

  deleteOne: async ({ filter }: { filter: object }, overrides?: Overrides) =>
    withReconnect(async () => {
      const collection = await getCollection(overrides)
      const results = await collection.deleteOne(filter)
      return { deletedCount: results.deletedCount }
    }),

  deleteMany: async ({ filter }: { filter: object }, overrides?: Overrides) =>
    withReconnect(async () => {
      const collection = await getCollection(overrides)
      const results = await collection.deleteMany(filter)
      return { deletedCount: results.deletedCount }
    }),

  find: async (
    {
      filter,
      projection,
      sort,
      limit,
      skip,
    }: {
      filter?: object
      projection?: object
      sort?: object
      limit?: number
      skip?: number
    },
    overrides?: Overrides
  ) =>
    withReconnect(async () => {
      const collection = await getCollection(overrides)
      let cursor = collection.find(filter || {})
      if (projection) cursor = cursor.project(projection)
      if (sort) cursor = cursor.sort(sort as Sort)
      if (limit) cursor = cursor.limit(limit)
      if (skip) cursor = cursor.skip(skip)
      return { documents: await cursor.toArray() }
    }),

  findOne: async (
    { filter, projection }: { filter?: object; projection?: object },
    overrides?: Overrides
  ) =>
    withReconnect(async () => {
      const collection = await getCollection(overrides)
      const doc = projection
        ? await collection.findOne(filter || {}, { projection })
        : await collection.findOne(filter || {})
      return { document: doc }
    }),

  insertOne: async ({ document }: { document: object }, overrides?: Overrides) =>
    withReconnect(async () => {
      const collection = await getCollection(overrides)
      const result = await collection.insertOne(removeNulls(document) as object)
      return { insertedId: result.insertedId?.toString() }
    }),

  insertMany: async ({ documents }: { documents: object[] }, overrides?: Overrides) =>
    withReconnect(async () => {
      const collection = await getCollection(overrides)
      const result = await collection.insertMany(documents.map((d) => removeNulls(d) as object))
      return { insertedIds: Object.values(result.insertedIds).map((id) => String(id)) }
    }),

  replaceOne: async (
    { filter, replacement, upsert }: { filter: object; replacement: object; upsert?: boolean },
    overrides?: Overrides
  ) =>
    withReconnect(async () => {
      const collection = await getCollection(overrides)
      const result = await collection.replaceOne(filter, removeNulls(replacement) as object, { upsert: !!upsert })
      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedId: result.upsertedId?.toString(),
      }
    }),

  updateOne: async (
    { filter, update, upsert }: { filter: object; update: object; upsert?: boolean },
    overrides?: Overrides
  ) =>
    withReconnect(async () => {
      const collection = await getCollection(overrides)
      const result = await collection.updateOne(filter, cleanMongoUpdate(update as Record<string, unknown>), {
        upsert: !!upsert,
      })
      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedId: result.upsertedId?.toString(),
      }
    }),

  updateMany: async (
    { filter, update, upsert }: { filter: object; update: object; upsert?: boolean },
    overrides?: Overrides
  ) =>
    withReconnect(async () => {
      const collection = await getCollection(overrides)
      const result = await collection.updateMany(filter, cleanMongoUpdate(update as Record<string, unknown>), {
        upsert: !!upsert,
      })
      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedId: result.upsertedId?.toString(),
      }
    }),
}
