import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const dir = dirname(fileURLToPath(import.meta.url))

export function readHttpVsDriverMarkdown(): string {
  try {
    const path = join(dir, "../../docs/http-vs-driver.md")
    const raw = readFileSync(path, "utf8")
    return raw.replace(/^#\s[^\n]*\n+/, "").trim()
  } catch {
    return ""
  }
}
