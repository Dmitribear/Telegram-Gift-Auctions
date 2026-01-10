import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

let replSet: MongoMemoryReplSet;

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({
    replSet: { storageEngine: "wiredTiger" },
  });
  const uri = replSet.getUri();
  await mongoose.connect(uri, {
    dbName: "testdb",
  });
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (replSet) {
    await replSet.stop();
  }
});
