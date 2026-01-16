import Redlock from "redlock";
import { redis } from "./redis";

export const redlock = new Redlock([redis], {
  driftFactor: 0.01,
  retryCount: 10,
  retryDelay: 200,
  retryJitter: 200,
});

redlock.on("error", (err) => {
  console.error("Redlock error", err);
});
