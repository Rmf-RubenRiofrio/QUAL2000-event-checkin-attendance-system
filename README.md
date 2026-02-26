# Event Check-In and Attendance System Handoff (Engineering -> QA)

This document describes the backend implementation delivered for QA review.
The service provides event creation, attendee registration, check-in tracking,
and attendance reporting using an in-memory SQLite database.

This project is designed to demonstrate:

- Separation of concerns (Service -> Repository -> Database)
- Unit testing of business rules
- Integration testing with real persistence
- Continuous Integration (CI) using GitHub Actions

## What Was Built

Three main layers were implemented (aligned with previous lab structure):

- `eventDb.js`: database connection, Promise-based query helpers, schema setup, teardown
- `eventRepo.js`: SQL data access for events, attendees, and check-ins
- `eventService.js`: input validation and business rules

Local manual test:

- `cli.js`: simple command-line interface to run the application manually in the local environment before moving to prod

The expected execution path is:

1. Service validates input and business rules.
2. Service calls repository methods.
3. Repository executes SQL using DB helpers.
4. Results return to service, then to caller/tests.

## Database Schema

### `events`

- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `event_code` TEXT NOT NULL UNIQUE
- `name` TEXT NOT NULL
- `event_date` TEXT NOT NULL

Each event must have a unique `event_code`.

### `attendees`

- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `event_id` INTEGER NOT NULL
- `email` TEXT NOT NULL
- `name` TEXT NOT NULL
- `created_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
- `UNIQUE(event_id, email)` prevents duplicate registration per event
- `FOREIGN KEY(event_id)` references `events(id)`

### `checkins`

- `id` INTEGER PRIMARY KEY AUTOINCREMENT
- `event_id` INTEGER NOT NULL
- `attendee_id` INTEGER NOT NULL
- `checked_in_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
- `UNIQUE(event_id, attendee_id)` prevents double check-in
- `FOREIGN KEY(event_id)` references `events(id)`
- `FOREIGN KEY(attendee_id)` references `attendees(id)`

## Service API Contract

### `createEvent(db, event)`

Input:

- `event.eventCode`: non-empty string (unique)
- `event.name`: non-empty string
- `event.eventDate`: non-empty string (ISO date recommended)

Behavior:

- Trims values
- Normalizes `eventCode` to uppercase
- Inserts into `events`
- Returns `{ id, eventCode, name, eventDate }`

Error behavior:

- Invalid input throws `TypeError`
- Duplicate event code fails with SQLite `UNIQUE constraint failed` error

---

### `registerAttendee(db, eventCode, attendee)`

Input:

- `eventCode`: non-empty string
- `attendee.name`: non-empty string
- `attendee.email`: valid email format

Behavior:

- Trims and normalizes email to lowercase
- Normalizes `eventCode` to uppercase for lookup
- Rejects if event does not exist
- Prevents duplicate registration (same email + same event)
- Inserts into `attendees`
- Returns `{ id, eventId, email, name }`

Error behavior:

- Invalid input throws `TypeError`
- Missing event throws `Error("event not found")`
- Duplicate registration throws `Error("duplicate registration")`
  or SQLite UNIQUE constraint error

---

### `checkInAttendee(db, eventCode, email)`

Input:

- `eventCode`: non-empty string
- `email`: valid email string

Behavior:

- Normalizes email and event code
- Ensures attendee is registered for the event
- Prevents double check-in
- Inserts into `checkins`
- Returns `{ id, eventId, attendeeId }`

Error behavior:

- Invalid input throws `TypeError`
- Event not found throws `Error("event not found")`
- Unregistered attendee throws `Error("attendee not registered")`
- Double check-in throws `Error("attendee already checked in")`

---

### `getAttendanceReport(db, eventCode)`

Input:

- `eventCode`: non-empty string

Behavior:

- Normalizes event code
- Returns:
  - `eventName`
  - `eventDate`
  - `totalRegistered`
  - `totalCheckedIn`
  - `checkedInAttendees` (array of `{ email, name, checkedInAt }`)

Error behavior:

- Invalid input throws `TypeError`
- Event not found throws `Error("event not found")`

## Testing Strategy (Aligned with QA Requirements)

### Unit Tests (node:test)

Unit tests validate business rules WITHOUT real database usage:

- Email validation
- Input validation
- Duplicate registration logic
- Check-in rule validation
- Error handling

These tests focus only on service logic.

### Integration Tests

Integration tests use:

- Real SQLite `:memory:` database
- Full flow: Service -> Repo -> DB

Covered scenarios:

1. Create event -> register attendee -> verify persistence
2. Register + check-in -> report reflects correct values
3. Duplicate registration prevention
4. Full workflow from event creation to attendance report

## QA Focus Areas

Please prioritize integration testing for:

1. End-to-end persistence through service -> repo -> db
2. Input validation at service boundary
3. Event code normalization consistency (`qa100` vs `QA100`)
4. Duplicate registration prevention (same email + same event)
5. Check-in rule enforcement (must be registered first)
6. Double check-in rejection
7. Accuracy of attendance report totals
8. Test isolation using fresh DB setup and teardown

## Known Implementation Notes

- Database is in-memory (`:memory:`), so data is non-persistent by design
- Business rule errors use explicit messages (e.g., `event not found`)
- SQLite constraint violations are not wrapped and may surface directly
- Service layer is responsible for validation and normalization

## Continuous Integration (CI)

This project includes a GitHub Actions workflow that:

- Runs automatically on:
  - Push
  - Pull Request
- Installs dependencies using `npm ci`
- Executes all tests using `node --test`
- Fails the pipeline if any test fails

CI file location:

.github/workflows/ci.yml
