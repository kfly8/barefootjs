import { describe, test, expect, mock } from "bun:test";
import { z } from "zod";
import { createEffect } from "@barefootjs/dom";
import { createForm } from "../src/create-form";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "At least 8 characters"),
});

function createSubmitEvent(): Event {
  return { preventDefault: mock(() => {}) } as unknown as Event;
}

function createInputEvent(value: string): Event {
  return { target: { value } } as unknown as Event;
}

// Helper to flush microtasks (validation is async)
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("createForm", () => {
  describe("initialization", () => {
    test("creates form with default values", () => {
      const form = createForm({
        schema,
        defaultValues: { email: "", password: "" },
      });
      const email = form.field("email");
      expect(email.value()).toBe("");
      expect(email.error()).toBe("");
      expect(email.touched()).toBe(false);
      expect(email.dirty()).toBe(false);
    });

    test("isSubmitting is initially false", () => {
      const form = createForm({
        schema,
        defaultValues: { email: "", password: "" },
      });
      expect(form.isSubmitting()).toBe(false);
    });

    test("isDirty is initially false", () => {
      const form = createForm({
        schema,
        defaultValues: { email: "", password: "" },
      });
      expect(form.isDirty()).toBe(false);
    });

    test("errors is initially empty", () => {
      const form = createForm({
        schema,
        defaultValues: { email: "", password: "" },
      });
      expect(form.errors()).toEqual({});
    });

    test("isValid is initially true (no errors)", () => {
      const form = createForm({
        schema,
        defaultValues: { email: "", password: "" },
      });
      expect(form.isValid()).toBe(true);
    });
  });

  describe("field()", () => {
    test("returns memoized field object", () => {
      const form = createForm({
        schema,
        defaultValues: { email: "", password: "" },
      });
      const a = form.field("email");
      const b = form.field("email");
      expect(a).toBe(b);
    });

    test("setValue updates value and dirty state", () => {
      const form = createForm({
        schema,
        defaultValues: { email: "", password: "" },
      });
      const email = form.field("email");
      email.setValue("test@example.com");
      expect(email.value()).toBe("test@example.com");
      expect(email.dirty()).toBe(true);
    });

    test("setValue back to default clears dirty", () => {
      const form = createForm({
        schema,
        defaultValues: { email: "initial", password: "" },
      });
      const email = form.field("email");
      email.setValue("changed");
      expect(email.dirty()).toBe(true);
      email.setValue("initial");
      expect(email.dirty()).toBe(false);
    });

    test("handleInput reads e.target.value", () => {
      const form = createForm({
        schema,
        defaultValues: { email: "", password: "" },
      });
      const email = form.field("email");
      email.handleInput(createInputEvent("hello@test.com"));
      expect(email.value()).toBe("hello@test.com");
    });

    test("handleBlur marks field as touched", () => {
      const form = createForm({
        schema,
        defaultValues: { email: "", password: "" },
      });
      const email = form.field("email");
      expect(email.touched()).toBe(false);
      email.handleBlur();
      expect(email.touched()).toBe(true);
    });
  });

  describe("validation timing", () => {
    test("validateOn: blur triggers validation on blur", async () => {
      const form = createForm({
        schema,
        defaultValues: { email: "", password: "" },
        validateOn: "blur",
      });
      const email = form.field("email");
      email.setValue("bad");
      await flush();
      expect(email.error()).toBe(""); // no validation yet

      email.handleBlur();
      await flush();
      expect(email.error()).toBe("Invalid email");
    });

    test("validateOn: input triggers validation on input", async () => {
      const form = createForm({
        schema,
        defaultValues: { email: "", password: "" },
        validateOn: "input",
      });
      const email = form.field("email");
      email.setValue("bad");
      await flush();
      expect(email.error()).toBe("Invalid email");
    });

    test("validateOn: submit does not validate on input or blur", async () => {
      const form = createForm({
        schema,
        defaultValues: { email: "", password: "" },
        validateOn: "submit",
      });
      const email = form.field("email");
      email.setValue("bad");
      email.handleBlur();
      await flush();
      expect(email.error()).toBe("");
    });

    test("revalidateOn: input revalidates after first validation", async () => {
      const form = createForm({
        schema,
        defaultValues: { email: "", password: "" },
        validateOn: "blur",
        revalidateOn: "input",
      });
      const email = form.field("email");

      // First validation on blur
      email.setValue("bad");
      email.handleBlur();
      await flush();
      expect(email.error()).toBe("Invalid email");

      // Revalidation on input (because revalidateOn: "input")
      email.setValue("test@example.com");
      await flush();
      expect(email.error()).toBe("");
    });
  });

  describe("handleSubmit", () => {
    test("calls preventDefault", async () => {
      const form = createForm({
        schema,
        defaultValues: { email: "test@example.com", password: "12345678" },
      });
      const event = createSubmitEvent();
      form.handleSubmit(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    test("sets errors on validation failure", async () => {
      const form = createForm({
        schema,
        defaultValues: { email: "bad", password: "short" },
      });
      form.field("email"); // ensure signals exist
      form.field("password");
      form.handleSubmit(createSubmitEvent());
      await flush();

      expect(form.field("email").error()).toBe("Invalid email");
      expect(form.field("password").error()).toBe("At least 8 characters");
    });

    test("calls onSubmit on validation success", async () => {
      const onSubmit = mock(() => {});
      const form = createForm({
        schema,
        defaultValues: { email: "test@example.com", password: "12345678" },
        onSubmit,
      });
      form.handleSubmit(createSubmitEvent());
      await flush();

      expect(onSubmit).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "12345678",
      });
    });

    test("manages isSubmitting state during sync onSubmit", async () => {
      const onSubmit = mock(() => {});
      const form = createForm({
        schema,
        defaultValues: { email: "test@example.com", password: "12345678" },
        onSubmit,
      });
      form.handleSubmit(createSubmitEvent());
      // isSubmitting is true while validation runs
      expect(form.isSubmitting()).toBe(true);
      await flush();
      expect(form.isSubmitting()).toBe(false);
    });

    test("manages isSubmitting state during async onSubmit", async () => {
      let resolveSubmit!: () => void;
      const onSubmit = mock(
        () => new Promise<void>((r) => (resolveSubmit = r)),
      );
      const form = createForm({
        schema,
        defaultValues: { email: "test@example.com", password: "12345678" },
        onSubmit,
      });
      form.handleSubmit(createSubmitEvent());
      await flush();
      // isSubmitting stays true during async onSubmit
      expect(form.isSubmitting()).toBe(true);
      resolveSubmit();
      await flush();
      expect(form.isSubmitting()).toBe(false);
    });

    test("does not call onSubmit on validation failure", async () => {
      const onSubmit = mock(() => {});
      const form = createForm({
        schema,
        defaultValues: { email: "bad", password: "short" },
        onSubmit,
      });
      form.handleSubmit(createSubmitEvent());
      await flush();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("reset", () => {
    test("resets all field values to defaults", () => {
      const form = createForm({
        schema,
        defaultValues: { email: "", password: "" },
      });
      const email = form.field("email");
      email.setValue("changed");
      expect(email.value()).toBe("changed");

      form.reset();
      expect(email.value()).toBe("");
    });

    test("clears errors, touched, and dirty states", async () => {
      const form = createForm({
        schema,
        defaultValues: { email: "bad", password: "short" },
      });
      const email = form.field("email");
      email.handleBlur();

      // Trigger validation via submit
      form.handleSubmit(createSubmitEvent());
      await flush();
      expect(email.error()).not.toBe("");

      form.reset();
      expect(email.error()).toBe("");
      expect(email.touched()).toBe(false);
      expect(email.dirty()).toBe(false);
    });
  });

  describe("setError", () => {
    test("sets error on a field manually", () => {
      const form = createForm({
        schema,
        defaultValues: { email: "", password: "" },
      });
      const email = form.field("email");
      expect(email.error()).toBe("");

      form.setError("email", "Email already taken");
      expect(email.error()).toBe("Email already taken");
    });

    test("creates field signals if not yet accessed", () => {
      const form = createForm({
        schema,
        defaultValues: { email: "", password: "" },
      });
      // setError before field() call
      form.setError("email", "Server error");
      const email = form.field("email");
      expect(email.error()).toBe("Server error");
    });
  });

  describe("derived state", () => {
    test("isDirty reflects any dirty field", () => {
      const form = createForm({
        schema,
        defaultValues: { email: "", password: "" },
      });
      const email = form.field("email");
      form.field("password"); // access to create signals
      expect(form.isDirty()).toBe(false);

      email.setValue("changed");
      expect(form.isDirty()).toBe(true);
    });

    test("errors aggregates all field errors", async () => {
      const form = createForm({
        schema,
        defaultValues: { email: "bad", password: "short" },
      });
      form.field("email");
      form.field("password");
      form.handleSubmit(createSubmitEvent());
      await flush();

      const errs = form.errors();
      expect(errs.email).toBe("Invalid email");
      expect(errs.password).toBe("At least 8 characters");
    });

    test("isValid is false when errors exist", async () => {
      const form = createForm({
        schema,
        defaultValues: { email: "bad", password: "short" },
      });
      form.field("email");
      form.field("password");
      expect(form.isValid()).toBe(true); // no errors initially

      form.handleSubmit(createSubmitEvent());
      await flush();
      expect(form.isValid()).toBe(false);
    });
  });

  describe("reactivity", () => {
    test("field value changes propagate to effects", () => {
      const form = createForm({
        schema,
        defaultValues: { email: "", password: "" },
      });
      const email = form.field("email");
      const observed: string[] = [];

      createEffect(() => {
        observed.push(email.value() as string);
      });

      expect(observed).toEqual([""]);
      email.setValue("a@b.com");
      expect(observed).toEqual(["", "a@b.com"]);
    });

    test("error changes propagate to effects", async () => {
      const form = createForm({
        schema,
        defaultValues: { email: "", password: "12345678" },
      });
      const email = form.field("email");
      const observed: string[] = [];

      createEffect(() => {
        observed.push(email.error());
      });

      expect(observed).toEqual([""]);
      form.setError("email", "Server error");
      expect(observed).toEqual(["", "Server error"]);
    });
  });
});
