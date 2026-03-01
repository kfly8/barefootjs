import type { StandardSchemaV1 } from "@standard-schema/spec";
import { getDotPath } from "@standard-schema/utils";

/**
 * Validate all fields against the schema and return a map of field name → error message.
 */
export async function validateSchema(
  schema: StandardSchemaV1<Record<string, unknown>>,
  values: Record<string, unknown>,
): Promise<Record<string, string>> {
  const result = await schema["~standard"].validate(values);
  if (!result.issues) {
    return {};
  }

  const errors: Record<string, string> = {};
  for (const issue of result.issues) {
    const path = getDotPath(issue);
    if (path && !errors[path]) {
      errors[path] = issue.message;
    }
  }
  return errors;
}

/**
 * Validate the full schema and extract the error for a specific field.
 * Returns empty string if the field has no error.
 */
export async function validateField(
  schema: StandardSchemaV1<Record<string, unknown>>,
  values: Record<string, unknown>,
  fieldName: string,
): Promise<string> {
  const errors = await validateSchema(schema, values);
  return errors[fieldName] ?? "";
}
