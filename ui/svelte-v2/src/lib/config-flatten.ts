export function flattenConfig(
  obj: Record<string, any>,
  prefix = "",
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      Object.assign(result, flattenConfig(value as Record<string, any>, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

export function unflattenConfig(
  flat: Record<string, any>,
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".");
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]!;
      const existing = current[part];
      if (
        existing === undefined ||
        existing === null ||
        typeof existing !== "object" ||
        Array.isArray(existing)
      ) {
        current[part] = {};
      }
      current = current[part] as Record<string, any>;
    }
    const last = parts[parts.length - 1]!;
    current[last] = value;
  }
  return result;
}
