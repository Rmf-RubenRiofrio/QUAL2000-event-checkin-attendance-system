const test = require("node:test");
const assert = require("node:assert/strict");

const { createDb, initSchema, closeDb } = require("../../src/eventDb");
const {
  createEvent,
  registerAttendee,
  checkInAttendee,
  getAttendanceReport,
} = require("../../src/eventService");

test.describe("Integration - Event Check-In System", () => {
  let db;

  test.beforeEach(async () => {
    db = createDb();
    await initSchema(db);
  });

  test.afterEach(async () => {
    await closeDb(db);
  });

  test("Create event -> register attendee -> report shows registered", async () => {
    await createEvent(db, { eventCode: " qa100 ", name: " QA Meetup ", eventDate: "2026-03-10" });
    await registerAttendee(db, "QA100", { email: "alice@mail.com", name: "Alice" });

    const report = await getAttendanceReport(db, "QA100");
    assert.equal(report.totalRegistered, 1);
    assert.equal(report.totalCheckedIn, 0);
  });

  test("Register + check-in -> report reflects checked-in", async () => {
    await createEvent(db, { eventCode: "QA200", name: "Checkin Test", eventDate: "2026-03-11" });
    await registerAttendee(db, "QA200", { email: "bob@mail.com", name: "Bob" });
    await checkInAttendee(db, "QA200", "bob@mail.com");

    const report = await getAttendanceReport(db, "QA200");
    assert.equal(report.totalRegistered, 1);
    assert.equal(report.totalCheckedIn, 1);
    assert.equal(report.checkedInAttendees[0].email, "bob@mail.com");
  });

  test("Duplicate registration is blocked", async () => {
    await createEvent(db, { eventCode: "QA300", name: "Dup Test", eventDate: "2026-03-12" });
    await registerAttendee(db, "QA300", { email: "dup@mail.com", name: "First" });

    await assert.rejects(
      async () => registerAttendee(db, "QA300", { email: "dup@mail.com", name: "Second" }),
      { name: "Error", message: "duplicate registration" },
    );
  });
});