> [!CAUTION]
> This project is highly experimental do not use in Production

![](https://firebasestorage.googleapis.com/v0/b/foomotion-9acd7.firebasestorage.app/o/brand%2Floyalio_banner.png?alt=media&token=c6e84d07-63e9-4bb0-a295-28e0ee6d4d41)
**Made by Loyalio for MongoDB Community**

# Loyalio Data Layer

HTTP proxy for MongoDB database. Created for use in serverless workers where connection to MongoDB is problematic. Long-lived process; holds a single MongoClient with auto-reconnect.

## Environment


| Variable                  | Description                                                  |
| ------------------------- | ------------------------------------------------------------ |
| `MONGODB_URI`             | Connection string                                            |
| `MONGODB_DATABASE_NAME`   | Default db (default: `database`)                             |
| `MONGODB_API_KEY`         | Required unless `IS_OFFLINE=true`                            |
| `IS_OFFLINE`              | `true` = skip service-cred check                             |
| `PORT`                    | Default: `2790`                                              |
| `DATA_LAYER_DISABLE_DOCS` | Set to `true` to disable `GET /openapi` and `GET /reference` |


### !!!! IS_OFFLINE SHOULD ALWAYS BE TRUE IN PRODUCTION !!!!

## API documentation
*Documentation is accesible on http://localhost:2790/reference if no changes was made to PORT env variable*

| Path             | Description                       |
| ---------------- | --------------------------------- |
| `GET /reference` | Scalar API Reference (OpenAPI UI) |
| `GET /openapi`   | OpenAPI 3.1 JSON for this service |


Overview and architecture are in **info**. **Actions** are grouped in the sidebar (`x-tagGroups`); each action has its own tag with advanced notes. **Schemas** lists `Payload`* types per action.

## API

**POST /v1/data** – Body: `{ action, payload?, overrides? }`. Headers: `service-cred`, `Content-Type: application/json`.


| action       | payload                                          | response                                       |
| ------------ | ------------------------------------------------ | ---------------------------------------------- |
| `aggregate`  | `{ pipeline }`                                   | `{ documents }`                                |
| `deleteOne`  | `{ filter }`                                     | `{ deletedCount }`                             |
| `deleteMany` | `{ filter }`                                     | `{ deletedCount }`                             |
| `find`       | `{ filter?, projection?, sort?, limit?, skip? }` | `{ documents }`                                |
| `findOne`    | `{ filter?, projection? }`                       | `{ document }`                                 |
| `insertOne`  | `{ document }`                                   | `{ insertedId }`                               |
| `insertMany` | `{ documents }`                                  | `{ insertedIds }`                              |
| `replaceOne` | `{ filter, replacement, upsert? }`               | `{ matchedCount, modifiedCount, upsertedId? }` |
| `updateOne`  | `{ filter, update, upsert? }`                    | `{ matchedCount, modifiedCount, upsertedId? }` |
| `updateMany` | `{ filter, update, upsert? }`                    | `{ matchedCount, modifiedCount, upsertedId? }` |


`overrides`: `{ database?, collection? }` – overrides default db/collection.

**GET/POST /ping** – `202`, `{ status: "ok" }`.

### Example

```bash
curl -X POST http://localhost:2790/v1/data \
  -H "Content-Type: application/json" \
  -H "service-cred: your-api-key" \
  -d '{
    "action": "find",
    "payload": {
      "filter": { "status": "active" },
      "limit": 10
    },
    "overrides": {
      "database": "app",
      "collection": "users"
    }
  }'
```

## Run

```bash
cp .env.example .env
pnpm install
pnpm dev
```

`pnpm build` → `dist/`. `pnpm start` → run compiled.


## Core Structure

```
src/
├── server.ts
├── app.ts
├── docs/
│   ├── openapi.ts
│   └── action-docs.ts
├── db/
│   ├── client.ts
│   ├── utils.ts
│   ├── operations.ts
│   └── index.ts
└── routes/
    ├── data.ts
    └── ping.ts
```
