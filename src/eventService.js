const {
  addEvent,
  findEventByCode,
  addAttendee,
  findAttendeeByEmail,
  countRegisteredByEventId,
  addCheckIn,
  isCheckedIn,
  countCheckedInByEventId,
  listCheckedInAttendeesByEventId,
} = require("./eventRepo");

const isValidEmail = (email) => {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed === "") return false;
  const re = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return re.test(trimmed);
};

const validateEvent = (event) => {
  if (!event || typeof event !== "object") {
    throw new TypeError("event must be an object");
  }
  if (typeof event.eventCode !== "string" || event.eventCode.trim() === "") {
    throw new TypeError("event.eventCode must be a non-empty string");
  }
  if (typeof event.name !== "string" || event.name.trim() === "") {
    throw new TypeError("event.name must be a non-empty string");
  }
  if (typeof event.eventDate !== "string" || event.eventDate.trim() === "") {
    throw new TypeError("event.eventDate must be a non-empty string");
  }
};

const validateAttendee = (attendee) => {
  if (!attendee || typeof attendee !== "object") {
    throw new TypeError("attendee must be an object");
  }
  if (typeof attendee.name !== "string" || attendee.name.trim() === "") {
    throw new TypeError("attendee.name must be a non-empty string");
  }
  if (typeof attendee.email !== "string" || attendee.email.trim() === "") {
    throw new TypeError("attendee.email must be a non-empty string");
  }
  if (!isValidEmail(attendee.email)) {
    throw new TypeError("attendee.email must be a valid email");
  }
};

const createEvent = async (db, event) => {
  validateEvent(event);

  return addEvent(db, {
    eventCode: event.eventCode.trim().toUpperCase(),
    name: event.name.trim(),
    eventDate: event.eventDate.trim(),
  });
};

const registerAttendee = async (db, eventCode, attendee) => {
  if (typeof eventCode !== "string" || eventCode.trim() === "") {
    throw new TypeError("eventCode must be a non-empty string");
  }
  validateAttendee(attendee);

  const normalizedEventCode = eventCode.trim().toUpperCase();
  const event = await findEventByCode(db, normalizedEventCode);
  if (!event) throw new Error("event not found");

  const normalizedEmail = attendee.email.trim().toLowerCase();
  const existing = await findAttendeeByEmail(db, event.id, normalizedEmail);
  if (existing) throw new Error("duplicate registration");

  return addAttendee(db, {
    eventId: event.id,
    email: normalizedEmail,
    name: attendee.name.trim(),
  });
};

const checkInAttendee = async (db, eventCode, email) => {
  if (typeof eventCode !== "string" || eventCode.trim() === "") {
    throw new TypeError("eventCode must be a non-empty string");
  }
  if (typeof email !== "string" || email.trim() === "") {
    throw new TypeError("email must be a non-empty string");
  }
  if (!isValidEmail(email)) {
    throw new TypeError("email must be a valid email");
  }

  const normalizedEventCode = eventCode.trim().toUpperCase();
  const event = await findEventByCode(db, normalizedEventCode);
  if (!event) throw new Error("event not found");

  const attendee = await findAttendeeByEmail(db, event.id, email.trim().toLowerCase());
  if (!attendee) throw new Error("attendee not registered");

  const already = await isCheckedIn(db, event.id, attendee.id);
  if (already) throw new Error("attendee already checked in");

  return addCheckIn(db, event.id, attendee.id);
};

const getAttendanceReport = async (db, eventCode) => {
  if (typeof eventCode !== "string" || eventCode.trim() === "") {
    throw new TypeError("eventCode must be a non-empty string");
  }

  const normalizedEventCode = eventCode.trim().toUpperCase();
  const event = await findEventByCode(db, normalizedEventCode);
  if (!event) throw new Error("event not found");

  const totalRegistered = await countRegisteredByEventId(db, event.id);
  const totalCheckedIn = await countCheckedInByEventId(db, event.id);
  const checkedInAttendees = await listCheckedInAttendeesByEventId(db, event.id);

  return {
    eventName: event.name,
    eventDate: event.eventDate,
    totalRegistered,
    totalCheckedIn,
    checkedInAttendees, 
  };
};

module.exports = {
  createEvent,
  registerAttendee,
  checkInAttendee,
  getAttendanceReport,
    isValidEmail,
  validateEvent,
  validateAttendee,
};