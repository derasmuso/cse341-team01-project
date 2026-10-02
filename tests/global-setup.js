// tests/global-setup.js

import { MongoMemoryServer } from 'mongodb-memory-server';

const setup = async (project) => {
  const mongoServer = await MongoMemoryServer.create({
    instance: {
      launchTimeout: 50000,
    }
  });

  project.provide(
    'MONGODB_TEST_URI', 
    mongoServer.getUri()
  );

  return async () => {
    await mongoServer.stop();
  };
};

export default setup;
