import { describe, test, expect } from "bun:test";
import { z } from "zod";
import { validateSchema, validateField } from "../src/validate";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "At least 8 characters"),
});

describe("validateSchema", () => {
  test("returns empty object for valid data", async () => {
    const errors = await validateSchema(schema, {
      email: "test@example.com",
      password: "12345678",
    });
    expect(errors).toEqual({});
  });

  test("returns errors keyed by field name", async () => {
    const errors = await validateSchema(schema, {
      email: "bad",
      password: "short",
    });
    expect(errors.email).toBe("Invalid email");
    expect(errors.password).toBe("At least 8 characters");
  });

  test("returns error for a single invalid field", async () => {
    const errors = await validateSchema(schema, {
      email: "test@example.com",
      password: "short",
    });
    expect(errors.email).toBeUndefined();
    expect(errors.password).toBe("At least 8 characters");
  });

  test("keeps only the first error per field", async () => {
    const strictSchema = z.object({
      name: z.string().min(2, "Too short").max(5, "Too long"),
    });
    // Empty string fails min(2)
    const errors = await validateSchema(strictSchema, { name: "" });
    expect(errors.name).toBe("Too short");
  });
});

describe("validateField", () => {
  test("returns error message for the specified field", async () => {
    const error = await validateField(
      schema,
      { email: "bad", password: "12345678" },
      "email",
    );
    expect(error).toBe("Invalid email");
  });

  test("returns empty string when field is valid", async () => {
    const error = await validateField(
      schema,
      { email: "test@example.com", password: "12345678" },
      "email",
    );
    expect(error).toBe("");
  });

  test("returns empty string for field not in errors", async () => {
    const error = await validateField(
      schema,
      { email: "bad", password: "12345678" },
      "password",
    );
    expect(error).toBe("");
  });
});
