import {
  actionTagDefinitions,
  dataTagOverview,
  operationRequestExamples,
  xTagGroups,
} from "./action-docs.js"
import { readHttpVsDriverMarkdown } from "./http-vs-driver-md.js"

export function isApiDocsEnabled(): boolean {
  return process.env.DATA_LAYER_DISABLE_DOCS !== "true"
}

function buildInfoDescription(): string {
  const base = `
  <img src="https://firebasestorage.googleapis.com/v0/b/foomotion-9acd7.firebasestorage.app/o/brand%2Floyalio_banner.png?alt=media&token=c6e84d07-63e9-4bb0-a295-28e0ee6d4d41" />
  
  **Built by Loyalio for MongoDB Community** check https://loyalio.app for more information
 

> A dedicated **Data Layer API client** package is coming soon—this reference documents the HTTP API it will target.

---

HTTP proxy for MongoDB. Long-lived Node process with a single MongoClient and auto-reconnect.

## Structure

| Area | Role |
|------|------|
| \`POST /v1/data\` | JSON body with \`action\`, \`payload\`, optional \`overrides\` |
| \`GET/POST /ping\` | Liveness; responds with \`202\` |
| Auth | \`service-cred\` header matches \`MONGODB_API_KEY\` unless \`IS_OFFLINE=true\` |

## Suggested Architecture

\`\`\`
┌──────────────┐     POST /v1/data      ┌────────────┐
│    Worker    │ ─────────────────────> │ Data Layer │
│ (Serverless) │   service-cred header  │   (Node)   │
└──────────────┘                        └─────┬──────┘
                                              │ MongoClient
                                              ▼
                                       ┌─────────────┐
                                       │   MongoDB   │
                                       └─────────────┘
\`\`\`

## Guides

### Authentication

Send header \`service-cred\` with the same value as server env \`MONGODB_API_KEY\`. When \`IS_OFFLINE=true\`, the service skips this check (use only in local/dev as documented for your deployment).

### Overrides

Optional \`overrides.database\` and \`overrides.collection\` override the default database and collection from environment.

### Actions

Each operation has its own **Actions** tag (sidebar) with payload, response, and advanced notes. **Schemas** lists \`Payload*\` types that mirror each \`action\`.

Errors: \`400\` for bad JSON, missing \`action\`, or unsupported action; \`403\` when auth fails; \`500\` for server/Mongo errors.`
  if (!isApiDocsEnabled()) return base
  const extra = readHttpVsDriverMarkdown()
  if (!extra) return base
  return `${base}

## HTTP API vs MongoDB driver

${extra}`
}

function operationExampleRefs(): Record<string, { $ref: string }> {
  const out: Record<string, { $ref: string }> = {}
  for (const key of Object.keys(operationRequestExamples)) {
    out[key] = { $ref: `#/components/examples/${key}` }
  }
  return out
}

function operationExamplesComponents(): Record<
  string,
  { summary: string; value: Record<string, unknown> }
> {
  const out: Record<string, { summary: string; value: Record<string, unknown> }> = {}
  for (const [key, ex] of Object.entries(operationRequestExamples)) {
    out[key] = {
      summary: ex.summary,
      value: ex.value as Record<string, unknown>,
    }
  }
  return out
}

export function getOpenApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Loyalio Data Layer API",
      version: "1.0.0",
      description: buildInfoDescription(),
    },
    tags: [
      { name: "Health", description: "Process liveness." },
      { name: "Data", description: dataTagOverview },
      ...actionTagDefinitions,
    ],
    "x-tagGroups": xTagGroups,
    servers: [{ url: "/", description: "Current host" }],
    paths: {
      "/ping": {
        get: {
          tags: ["Health"],
          summary: "Ping (GET)",
          description: "Returns `202` with `{ status: \"ok\" }` when the service is up.",
          responses: {
            "202": {
              description: "Accepted",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PingResponse" },
                },
              },
            },
          },
        },
        post: {
          tags: ["Health"],
          summary: "Ping (POST)",
          description: "Same as GET; useful when clients prefer POST.",
          responses: {
            "202": {
              description: "Accepted",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/PingResponse" },
                },
              },
            },
          },
        },
      },
      "/v1/data": {
        post: {
          tags: ["Data"],
          summary: "Execute MongoDB action",
          description: `Dispatches \`action\` to the matching operation. Requires \`service-cred\` unless the server runs with \`IS_OFFLINE=true\`.

Use the **Actions** tag group for per-operation documentation, and **Schemas** \`Payload*\` for request body field shapes.`,
          security: [{ ServiceCredential: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/DataRequest" },
                examples: operationExampleRefs(),
              },
            },
          },
          responses: {
            "200": {
              description: "Operation result (shape depends on action).",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DataSuccess" },
                  examples: {
                    findResult: { $ref: "#/components/examples/responseFind" },
                    insertOneResult: { $ref: "#/components/examples/responseInsertOne" },
                    updateOneResult: { $ref: "#/components/examples/responseUpdateOne" },
                  },
                },
              },
            },
            "400": {
              description: "Invalid JSON, missing `action`, or unsupported action.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorBody" },
                },
              },
            },
            "403": {
              description: "Missing or invalid `service-cred`.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorBody" },
                },
              },
            },
            "500": {
              description: "Server or MongoDB error.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorBody" },
                },
              },
            },
          },
        },
      },
    },
    components: {
      examples: {
        ...operationExamplesComponents(),
        responseFind: {
          summary: "find — cursor batch",
          value: {
            documents: [
              { _id: "507f1f77bcf86cd799439011", email: "a@example.com", status: "active" },
              { _id: "507f191e810c19729de860ea", email: "b@example.com", status: "active" },
            ],
          },
        },
        responseInsertOne: {
          summary: "insertOne — new id",
          value: { insertedId: "507f1f77bcf86cd799439011" },
        },
        responseUpdateOne: {
          summary: "updateOne — counts",
          value: { matchedCount: 1, modifiedCount: 1, upsertedId: null },
        },
      },
      securitySchemes: {
        ServiceCredential: {
          type: "apiKey",
          in: "header",
          default: true,
          name: "service-cred",
        },
      },
      schemas: {
        PingResponse: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["ok"] },
          },
        },
        Overrides: {
          type: "object",
          properties: {
            database: { type: "string" },
            collection: { type: "string" },
          },
        },
        DataRequest: {
          type: "object",
          required: ["action"],
          properties: {
            action: {
              type: "string",
              enum: [
                "aggregate",
                "deleteOne",
                "deleteMany",
                "find",
                "findOne",
                "insertOne",
                "insertMany",
                "replaceOne",
                "updateOne",
                "updateMany",
              ],
            },
            payload: {
              type: "object",
              additionalProperties: true,
              description:
                "Depends on `action`. See **Actions** tags and Schemas: `PayloadAggregate`, `PayloadDeleteMany`, `PayloadDeleteOne`, `PayloadFind`, `PayloadFindOne`, `PayloadInsertMany`, `PayloadInsertOne`, `PayloadReplaceOne`, `PayloadUpdateMany`, `PayloadUpdateOne`.",
            },
            overrides: { $ref: "#/components/schemas/Overrides" },
          },
        },
        PayloadAggregate: {
          title: "PayloadAggregate",
          description: "`payload` when `action` is `aggregate`.",
          type: "object",
          required: ["pipeline"],
          properties: {
            pipeline: {
              type: "array",
              items: { type: "object", additionalProperties: true },
            },
          },
        },
        PayloadDeleteMany: {
          title: "PayloadDeleteMany",
          description: "`payload` when `action` is `deleteMany`.",
          type: "object",
          required: ["filter"],
          properties: {
            filter: { type: "object", additionalProperties: true },
          },
        },
        PayloadDeleteOne: {
          title: "PayloadDeleteOne",
          description: "`payload` when `action` is `deleteOne`.",
          type: "object",
          required: ["filter"],
          properties: {
            filter: { type: "object", additionalProperties: true },
          },
        },
        PayloadFind: {
          title: "PayloadFind",
          description: "`payload` when `action` is `find`.",
          type: "object",
          properties: {
            filter: { type: "object", additionalProperties: true },
            projection: { type: "object", additionalProperties: true },
            sort: { type: "object", additionalProperties: true },
            limit: { type: "number" },
            skip: { type: "number" },
          },
        },
        PayloadFindOne: {
          title: "PayloadFindOne",
          description: "`payload` when `action` is `findOne`.",
          type: "object",
          properties: {
            filter: { type: "object", additionalProperties: true },
            projection: { type: "object", additionalProperties: true },
          },
        },
        PayloadInsertMany: {
          title: "PayloadInsertMany",
          description: "`payload` when `action` is `insertMany`.",
          type: "object",
          required: ["documents"],
          properties: {
            documents: {
              type: "array",
              items: { type: "object", additionalProperties: true },
            },
          },
        },
        PayloadInsertOne: {
          title: "PayloadInsertOne",
          description: "`payload` when `action` is `insertOne`.",
          type: "object",
          required: ["document"],
          properties: {
            document: { type: "object", additionalProperties: true },
          },
        },
        PayloadReplaceOne: {
          title: "PayloadReplaceOne",
          description: "`payload` when `action` is `replaceOne`.",
          type: "object",
          required: ["filter", "replacement"],
          properties: {
            filter: { type: "object", additionalProperties: true },
            replacement: { type: "object", additionalProperties: true },
            upsert: { type: "boolean" },
          },
        },
        PayloadUpdateMany: {
          title: "PayloadUpdateMany",
          description: "`payload` when `action` is `updateMany`.",
          type: "object",
          required: ["filter", "update"],
          properties: {
            filter: { type: "object", additionalProperties: true },
            update: { type: "object", additionalProperties: true },
            upsert: { type: "boolean" },
          },
        },
        PayloadUpdateOne: {
          title: "PayloadUpdateOne",
          description: "`payload` when `action` is `updateOne`.",
          type: "object",
          required: ["filter", "update"],
          properties: {
            filter: { type: "object", additionalProperties: true },
            update: { type: "object", additionalProperties: true },
            upsert: { type: "boolean" },
          },
        },
        DataSuccess: {
          description:
            "Successful operation payload (varies by action). See **Actions** tags for response shapes.",
          type: "object",
          additionalProperties: true,
        },
        ErrorBody: {
          type: "object",
          required: ["error"],
          properties: {
            error: { type: "string" },
          },
        },
      },
    },
  }
}
