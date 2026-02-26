const test = require("node:test");
const assert = require("node:assert/strict");
const { isValidEmail, validateEvent, validateAttendee } = require("../../src/eventService");

test.describe("Unit - validation (no DB)", () => {
  test("isValidEmail accepts a valid email", () => {
    assert.equal(isValidEmail("test@example.com"), true);
  });

  test("isValidEmail rejects invalid email", () => {
    assert.equal(isValidEmail("not-an-email"), false);
  });

  test("validateEvent rejects invalid object", async () => {
    assert.throws(() => validateEvent(null), {
      name: "TypeError",
      message: "event must be an object",
    });
  });

  test("validateEvent rejects empty eventCode", () => {
    assert.throws(() => validateEvent({ eventCode: " ", name: "X", eventDate: "2026-03-10" }), {
      name: "TypeError",
      message: "event.eventCode must be a non-empty string",
    });
  });

  test("validateAttendee rejects invalid email format", () => {
    assert.throws(() => validateAttendee({ name: "Alice", email: "bad" }), {
      name: "TypeError",
      message: "attendee.email must be a valid email",
    });
  });
});