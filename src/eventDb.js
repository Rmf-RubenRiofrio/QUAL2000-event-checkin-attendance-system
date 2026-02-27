const sqlite3 = require("sqlite3");

const createDb = (dbFile = ":memory:") => {
  return new sqlite3.Database(dbFile);
};

const run = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
};

const get = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

const all = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const initSchema = async (db) => {
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      event_date TEXT NOT NULL
    )`,
  );

  
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS attendees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, email),
      FOREIGN KEY(event_id) REFERENCES events(id)
    )`,
  );

  
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      attendee_id INTEGER NOT NULL,
      checked_in_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id, attendee_id),
      FOREIGN KEY(event_id) REFERENCES events(id),
      FOREIGN KEY(attendee_id) REFERENCES attendees(id)
    )`,
  );
};

const closeDb = (db) => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
};

module.exports = {
  createDb,
  initSchema,
  run,
  get,
  all,
  closeDb,
};