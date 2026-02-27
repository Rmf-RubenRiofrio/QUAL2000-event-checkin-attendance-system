const { createDb, initSchema, closeDb } = require("./eventDb");
const {
  createEvent,
  registerAttendee,
  checkInAttendee,
  getAttendanceReport,
} = require("./eventService");

const main = async () => {
  const [cmd, ...args] = process.argv.slice(2);

  const db = createDb("events.db");
  await initSchema(db);

  try {
    if (cmd === "create-event") {
      const [eventCode, name, eventDate] = args;
      const event = await createEvent(db, { eventCode, name, eventDate });
      console.log(JSON.stringify(event, null, 2));
      return;
    }

    if (cmd === "register") {
      const [eventCode, email, name] = args;
      const attendee = await registerAttendee(db, eventCode, { email, name });
      console.log(JSON.stringify(attendee, null, 2));
      return;
    }

    if (cmd === "checkin") {
      const [eventCode, email] = args;
      const checkin = await checkInAttendee(db, eventCode, email);
      console.log(JSON.stringify(checkin, null, 2));
      return;
    }

    if (cmd === "report") {
      const [eventCode] = args;
      const report = await getAttendanceReport(db, eventCode);
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    console.log(`Unknown command: ${cmd}
Commands:
  create-event <EVENT_CODE> <NAME> <YYYY-MM-DD>
  register <EVENT_CODE> <EMAIL> <NAME>
  checkin <EVENT_CODE> <EMAIL>
  report <EVENT_CODE>`);
  } finally {
    await closeDb(db);
  }
};

main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});