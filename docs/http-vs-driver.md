# HTTP data-layer API vs MongoDB Node driver

This service exposes MongoDB through **JSON over HTTP** (`POST /v1/data`). The **query/update document shapes** inside `payload` are normal MongoDB BSON-compatible JSON—the same operators and field semantics you would use with the official **Node.js driver** on a `Collection`. The differences are in **how you call it**, **what options exist**, **how results come back**, and **small server-side normalization**.

## What is the same

- **MongoDB language** — Filters, update pipelines, aggregation stages, and document shapes match what the server accepts for those operations.
- **Per-operation inputs** — For each supported `action`, `payload` carries the same *logical* arguments as the matching `collection.*` call (e.g. `filter` + `update` + optional `upsert` for updates).

## What is different

### 1. Request shape

| HTTP (this service) | Node driver |
|---------------------|-------------|
| One endpoint: `POST /v1/data` with body `{ action, payload, overrides? }` | In-process: `collection.find(...)`, `collection.updateOne(...)`, etc. |
| Auth via `service-cred` header (unless `IS_OFFLINE=true`) | Connection string + in-process credentials |
| JSON only | Rich types (`ObjectId`, `Date`, `Binary`, sessions, cursors) |

`overrides.database` / `overrides.collection` select db/collection for that request; the driver uses whatever `db.collection()` you already have.

### 2. `find` layout vs driver chaining

| Field in `payload` | Driver equivalent |
|--------------------|-------------------|
| `filter` | First argument to `find()` |
| `projection` | `find(filter, { projection })` |
| `sort`, `limit`, `skip` | Chained: `.sort().limit().skip()` |

The HTTP API **flattens** filter + options + chain into one `payload` object; the driver splits them across arguments and chain methods.

### 3. Driver options not exposed

The service forwards only what `routes/data.ts` maps to `db/operations.ts`. Typical **driver options** are **not** available on the wire unless you extend the service, for example:

- Sessions and transactions
- `collation`, `hint`, `maxTimeMS`, `comment`, read concern / preference (except what default connection implies)
- `insertMany` `ordered` and other bulk insert options
- `FindOptions` / `AggregateOptions` beyond what is implemented (e.g. no `batchSize` on the HTTP cursor—results are fully materialized as JSON arrays)
- Change streams, raw commands, `bulkWrite`, gridfs, etc.

### 4. Server-side preprocessing

- **Inserts** — Documents are passed through `removeNulls` before `insertOne` / `insertMany` (see `db/utils.ts`).
- **Updates** — Update documents are passed through `cleanMongoUpdate` (strips nulls inside operator objects).

So the exact document the driver receives may differ slightly from the raw JSON you sent (mainly removal of `null` / `undefined` in nested structures).

### 5. Response shape

Responses are **JSON-friendly** and sometimes **wrapped**:

| Operation | HTTP response (typical) | Driver return |
|-----------|-------------------------|---------------|
| `find` | `{ documents: [...] }` | Cursor; you call `toArray()` |
| `findOne` | `{ document: ... \| null }` | Document or `null` |
| `aggregate` | `{ documents: [...] }` | Cursor → `toArray()` |
| `insertOne` | `{ insertedId: string }` | `InsertOneResult` with `ObjectId` |
| `insertMany` | `{ insertedIds: string[] }` | `InsertManyResult` with `ObjectId` map |
| `update*` / `replaceOne` | `matchedCount`, `modifiedCount`, `upsertedId` (id as string when present) | Same counts; ids as `ObjectId` |

Errors from the service are `{ error: string }` with HTTP status codes; driver errors are thrown in-process with different types.

### 6. Type fidelity

JSON has no `ObjectId` or `Date` types in transit. Clients send strings/numbers/objects; the driver and server interpret them per MongoDB rules. Anything that relied on **native driver types** in memory does not apply to the HTTP client—only serialized JSON.

## Quick reference: `action` → driver call

| `action` | Maps to (conceptually) |
|----------|---------------------------|
| `aggregate` | `collection.aggregate(pipeline).toArray()` |
| `deleteMany` | `collection.deleteMany(filter)` |
| `deleteOne` | `collection.deleteOne(filter)` |
| `find` | `collection.find(filter).project().sort().limit().skip().toArray()` |
| `findOne` | `collection.findOne(filter, { projection })` |
| `insertMany` | `collection.insertMany(documents)` |
| `insertOne` | `collection.insertOne(document)` |
| `replaceOne` | `collection.replaceOne(filter, replacement, { upsert })` |
| `updateMany` | `collection.updateMany(filter, update, { upsert })` |
| `updateOne` | `collection.updateOne(filter, update, { upsert })` |

## Where the mapping is implemented

- `apps/data-layer/src/routes/data.ts` — `action` → `payload` fields
- `apps/data-layer/src/db/operations.ts` — calls into `Collection` methods
- `apps/data-layer/src/db/utils.ts` — `removeNulls`, `cleanMongoUpdate`

For request/response examples and schemas, use `GET /reference` (Scalar) or `GET /openapi` when API docs are enabled (`DATA_LAYER_DISABLE_DOCS` unset or not `true`). The same content (including this section) appears under **Introduction** in Scalar.
