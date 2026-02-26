const { run, get, all } = require("./eventDb");

const addEvent = async (db, event) => {
  const result = await run(
    db,
    "INSERT INTO events(event_code, name, event_date) VALUES(?,?,?)",
    [event.eventCode, event.name, event.eventDate],
  );

  return {
    id: result.lastID,
    eventCode: event.eventCode,
    name: event.name,
    eventDate: event.eventDate,
  };
};

const findEventByCode = (db, eventCode) => {
  return get(
    db,
    "SELECT id, event_code as eventCode, name, event_date as eventDate FROM events WHERE event_code = ?",
    [eventCode],
  );
};

const addAttendee = async (db, attendee) => {
  const result = await run(
    db,
    "INSERT INTO attendees(event_id, email, name) VALUES(?,?,?)",
    [attendee.eventId, attendee.email, attendee.name],
  );

  return {
    id: result.lastID,
    eventId: attendee.eventId,
    email: attendee.email,
    name: attendee.name,
  };
};

const findAttendeeByEmail = (db, eventId, email) => {
  return get(
    db,
    "SELECT id, event_id as eventId, email, name FROM attendees WHERE event_id = ? AND email = ?",
    [eventId, email],
  );
};

const countRegisteredByEventId = async (db, eventId) => {
  const row = await get(db, "SELECT COUNT(*) as cnt FROM attendees WHERE event_id = ?", [eventId]);
  return row.cnt;
};

const addCheckIn = async (db, eventId, attendeeId) => {
  const result = await run(
    db,
    "INSERT INTO checkins(event_id, attendee_id) VALUES(?,?)",
    [eventId, attendeeId],
  );

  return { id: result.lastID, eventId, attendeeId };
};

const isCheckedIn = async (db, eventId, attendeeId) => {
  const row = await get(
    db,
    "SELECT 1 FROM checkins WHERE event_id = ? AND attendee_id = ?",
    [eventId, attendeeId],
  );
  return !!row;
};

const countCheckedInByEventId = async (db, eventId) => {
  const row = await get(db, "SELECT COUNT(*) as cnt FROM checkins WHERE event_id = ?", [eventId]);
  return row.cnt;
};

const listCheckedInAttendeesByEventId = (db, eventId) => {
  return all(
    db,
    `SELECT a.email, a.name, c.checked_in_at as checkedInAt
     FROM checkins c
     JOIN attendees a ON a.id = c.attendee_id
     WHERE c.event_id = ?
     ORDER BY a.email`,
    [eventId],
  );
};

module.exports = {
  addEvent,
  findEventByCode,
  addAttendee,
  findAttendeeByEmail,
  countRegisteredByEventId,
  addCheckIn,
  isCheckedIn,
  countCheckedInByEventId,
  listCheckedInAttendeesByEventId,
};