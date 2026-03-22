type ActionDoc = {
  name: string
  intro: string
  payloadTable: string
  success: string
  advanced: string
  exampleSummary: string
  exampleRequest: Record<string, unknown>
}

const actions: ActionDoc[] = [
  {
    name: "aggregate",
    intro:
      "Runs a MongoDB **aggregation pipeline** on the target collection (or overridden db/collection).",
    payloadTable: `| Field | Type | Notes |
|-------|------|--------|
| \`pipeline\` | \`object[]\` | Required. Standard aggregation stages (\`$match\`, \`$group\`, \`$lookup\`, …). |`,
    success:
      "\`{ documents: [...] }\` — array of pipeline result documents (same shape as driver \`toArray()\` on cursor).",
    advanced: `- Prefer early \`$match\` / indexes on large collections.
- Stages run server-side; very wide documents still count toward memory limits.
- Driver options like \`allowDiskUse\` are not exposed here—keep pipelines within normal Atlas limits.`,
    exampleSummary: "aggregate — pipeline",
    exampleRequest: {
      action: "aggregate",
      payload: {
        pipeline: [
          { $match: { status: "active" } },
          { $group: { _id: "$region", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 20 },
        ],
      },
    },
  },
  {
    name: "deleteMany",
    intro: "Deletes **all** documents matching \`filter\`.",
    payloadTable: `| Field | Type | Notes |
|-------|------|--------|
| \`filter\` | \`object\` | Required (use \`{}\` only if you truly mean “match everything”). |`,
    success: "\`{ deletedCount: number }\`",
    advanced: `- Empty filter deletes the whole collection’s documents—guard in application code.
- Use the same indexing strategy as large \`find\` / \`updateMany\` queries.`,
    exampleSummary: "deleteMany — match many",
    exampleRequest: {
      action: "deleteMany",
      payload: { filter: { status: "archived", purgeBefore: { $lt: "2024-01-01" } } },
    },
  },
  {
    name: "deleteOne",
    intro:
      "Deletes **at most one** document matching \`filter\` (driver picks first match if multiple).",
    payloadTable: `| Field | Type | Notes |
|-------|------|--------|
| \`filter\` | \`object\` | Required. Use a unique key (e.g. \`_id\`) when you intend a single row. |`,
    success: "\`{ deletedCount: 0 | 1 }\`",
    advanced: `- If \`deletedCount\` is \`0\`, no document matched.`,
    exampleSummary: "deleteOne — by filter",
    exampleRequest: {
      action: "deleteOne",
      payload: { filter: { _id: "507f1f77bcf86cd799439011" } },
    },
  },
  {
    name: "find",
    intro:
      "Returns a **batch** of documents matching \`filter\`, with optional projection, sort, and pagination.",
    payloadTable: `| Field | Type | Notes |
|-------|------|--------|
| \`filter\` | \`object\` | MongoDB query; omit or \`{}\` for all documents (use with care). |
| \`projection\` | \`object\` | Include/exclude fields (\`1\` / \`0\`). |
| \`sort\` | \`object\` | Sort keys; values \`1\` / \`-1\` or \`$meta\` where supported. |
| \`limit\` | \`number\` | Max documents returned. |
| \`skip\` | \`number\` | Offset (pagination); large skips can be expensive without range queries. |`,
    success: "\`{ documents: [...] }\`",
    advanced: `- Combine \`sort\` + \`limit\` for “top N” patterns.
- For deep pagination, prefer keyset / range filters on indexed fields over huge \`skip\`.`,
    exampleSummary: "find — filter, sort, pagination",
    exampleRequest: {
      action: "find",
      payload: {
        filter: { status: "active" },
        projection: { _id: 1, email: 1, name: 1 },
        sort: { createdAt: -1 },
        limit: 25,
        skip: 0,
      },
      overrides: { database: "app", collection: "users" },
    },
  },
  {
    name: "findOne",
    intro: "Returns **one** document or \`null\` if none match.",
    payloadTable: `| Field | Type | Notes |
|-------|------|--------|
| \`filter\` | \`object\` | Query; use unique selectors when you expect a single logical row. |
| \`projection\` | \`object\` | Optional field inclusion/exclusion. |`,
    success:
      "\`{ document: object | null }\` (shape follows your driver’s serialization of \`findOne\` result).",
    advanced: `- If multiple documents match, which one you get is not guaranteed unless \`filter\` is unique.`,
    exampleSummary: "findOne — single document",
    exampleRequest: {
      action: "findOne",
      payload: {
        filter: { _id: "507f1f77bcf86cd799439011" },
        projection: { password: 0 },
      },
    },
  },
  {
    name: "insertMany",
    intro: "Inserts **multiple** documents in one request.",
    payloadTable: `| Field | Type | Notes |
|-------|------|--------|
| \`documents\` | \`object[]\` | Required. Non-empty array of documents to insert. |`,
    success:
      "\`{ insertedIds: [...] }\` — ordered list of generated \`_id\` values where applicable.",
    advanced: `- Large batches reduce round-trips but increase single-request payload size.
- Duplicate key errors surface as \`500\` with the driver error message unless handled upstream.`,
    exampleSummary: "insertMany — bulk insert",
    exampleRequest: {
      action: "insertMany",
      payload: {
        documents: [
          { sku: "A1", qty: 1 },
          { sku: "B2", qty: 3 },
        ],
      },
    },
  },
  {
    name: "insertOne",
    intro: "Inserts a **single** document.",
    payloadTable: `| Field | Type | Notes |
|-------|------|--------|
| \`document\` | \`object\` | Required. May omit \`_id\` to let MongoDB generate an ObjectId. |`,
    success: "\`{ insertedId: ... }\`",
    advanced: `- Unique indexes on fields in \`document\` will throw on conflict.
- Timestamps and defaults should be set in application logic before insert.`,
    exampleSummary: "insertOne — create document",
    exampleRequest: {
      action: "insertOne",
      payload: {
        document: {
          email: "user@example.com",
          name: "Ada",
          status: "pending",
          createdAt: "2025-03-22T12:00:00.000Z",
        },
      },
      overrides: { collection: "users" },
    },
  },
  {
    name: "replaceOne",
    intro:
      "Replaces **one** document matching \`filter\` with \`replacement\` (full document replace, not patch operators).",
    payloadTable: `| Field | Type | Notes |
|-------|------|--------|
| \`filter\` | \`object\` | Required. |
| \`replacement\` | \`object\` | Required. Full new document (no \`$set\`—use **updateOne** for operators). |
| \`upsert\` | \`boolean\` | If \`true\`, insert \`replacement\` when no match. |`,
    success: "\`{ matchedCount, modifiedCount, upsertedId? }\`",
    advanced: `- \`replacement\` typically should not include partial update operators; use **updateOne** for \`$set\` / \`$inc\`.`,
    exampleSummary: "replaceOne — full document replace",
    exampleRequest: {
      action: "replaceOne",
      payload: {
        filter: { _id: "507f1f77bcf86cd799439011" },
        replacement: { email: "new@example.com", name: "Grace", version: 2 },
        upsert: false,
      },
    },
  },
  {
    name: "updateMany",
    intro: "Updates **all** documents matching \`filter\` with \`update\` (operators allowed).",
    payloadTable: `| Field | Type | Notes |
|-------|------|--------|
| \`filter\` | \`object\` | Required. |
| \`update\` | \`object\` | Required. Update document with operators (\`$set\`, \`$unset\`, …). |
| \`upsert\` | \`boolean\` | Optional. |`,
    success: "\`{ matchedCount, modifiedCount, upsertedId? }\`",
    advanced: `- Broad \`filter\` affects many rows—validate in app code before sending.`,
    exampleSummary: "updateMany — multi update",
    exampleRequest: {
      action: "updateMany",
      payload: {
        filter: { batchId: "batch-2025-03" },
        update: { $set: { processed: true } },
      },
    },
  },
  {
    name: "updateOne",
    intro: "Updates **at most one** document matching \`filter\`.",
    payloadTable: `| Field | Type | Notes |
|-------|------|--------|
| \`filter\` | \`object\` | Required. |
| \`update\` | \`object\` | Required. Operators (\`$set\`, \`$inc\`, \`$currentDate\`, …). |
| \`upsert\` | \`boolean\` | If \`true\`, insert if no match (subject to index rules). |`,
    success: "\`{ matchedCount, modifiedCount, upsertedId? }\`",
    advanced: `- \`modifiedCount\` can be \`0\` if the matched doc already satisfied the update.
- Use a unique \`filter\` (e.g. \`_id\`) when you intend a single logical update.`,
    exampleSummary: "updateOne — patch with operators",
    exampleRequest: {
      action: "updateOne",
      payload: {
        filter: { email: "user@example.com" },
        update: { $set: { status: "verified" }, $currentDate: { verifiedAt: true } },
        upsert: false,
      },
    },
  },
]

function actionSectionMarkdown(a: ActionDoc): string {
  const exampleJson = JSON.stringify(a.exampleRequest, null, 2)
  return `### ${a.name}

${a.intro}

**Payload**

${a.payloadTable}

**Example request body** (\`POST /v1/data\`, \`Content-Type: application/json\`)

\`\`\`json
${exampleJson}
\`\`\`

**Success response**

${a.success}

**Advanced**

${a.advanced}`
}

export const dataTagOverview = `Entry point for all MongoDB operations. Send **POST** \`/v1/data\` with JSON:

- \`action\` — one of the **Actions** tags below
- \`payload\` — shape depends on \`action\` (see **Schemas** \`Payload*\` or each action tag)
- \`overrides\` — optional \`database\` / \`collection\`

The **Actions** group lists each operation with payload fields, responses, and edge cases.`

export const actionTagDefinitions: { name: string; description: string }[] = actions.map((a) => ({
  name: a.name,
  description: actionSectionMarkdown(a),
}))

export const actionTagNames = actionTagDefinitions.map((t) => t.name)

export const xTagGroups = [
  { name: "Service", tags: ["Health", "Data"] },
  { name: "Actions", tags: actionTagNames },
]

export const operationRequestExamples: Record<
  string,
  { summary: string; value: Record<string, unknown> }
> = Object.fromEntries(
  actions.map((a) => [a.name, { summary: a.exampleSummary, value: a.exampleRequest }])
)
