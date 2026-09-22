import { afterAll, beforeAll, beforeEach, inject } from 'vitest';
import mongoose from 'mongoose';
import { closeDb, connectToDb, getDb } from '../src/db/connect.js';
import { initializeDatabase } from '../src/db/initialize.js';

const connectionString = inject('MONGODB_TEST_URI');
const databaseName = 'kizuna-rail-test';

beforeAll(async () => {
  await connectToDb({
    connectionString,
    databaseName
  });

  // Mongoose-backed models (e.g. bookings) need their own connection to the
  // same test database, mirroring what server.js does in production.
  await mongoose.connect(connectionString, { dbName: databaseName });
});

beforeEach(async () => {
  const db = getDb();
  await db.dropDatabase();
  await initializeDatabase(db);
});

afterAll(async () => {
  await mongoose.disconnect();
  await closeDb();
});

