import { Scalar } from "@scalar/hono-api-reference"
import { Hono } from "hono"
import { getOpenApiDocument, isApiDocsEnabled } from "./docs/openapi.js"
import { devLogger } from "./dev/logger.js"
import { handleDataRequest } from "./routes/data.js"
import { handlePing } from "./routes/ping.js"

const isDev = process.env.NODE_ENV !== "production"

export function createApp() {
  const app = new Hono()
  if (isDev) app.use("*", devLogger)
  if (isApiDocsEnabled()) {
    app.get("/openapi", (c) => c.json(getOpenApiDocument()))
    app.get(
      "/reference",
      Scalar({
        showDeveloperTools: "never",
        url: "/openapi",
        pageTitle: "Loyalio Data Layer",
      })
    )
  }
  app.post("/v1/data", handleDataRequest)
  app.post("/ping", handlePing)
  app.get("/ping", handlePing)
  return app
}
