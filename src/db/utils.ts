export function removeNulls<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(removeNulls).filter((v) => v !== null && v !== undefined) as T
  }
  if (obj !== null && typeof obj === "object") {
    const cleaned: Record<string, unknown> = {}
    for (const key in obj as object) {
      const value = removeNulls((obj as Record<string, unknown>)[key])
      if (value !== null && value !== undefined) cleaned[key] = value
    }
    return cleaned as T
  }
  return obj
}

export function cleanMongoUpdate(update: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {}
  for (const op in update) {
    if (typeof update[op] === "object" && update[op] !== null) {
      cleaned[op] = removeNulls(update[op])
    } else {
      cleaned[op] = update[op]
    }
  }
  return cleaned
}
