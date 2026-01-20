type LogLevel = "info" | "warn" | "error" | "debug";

const levelOrder: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const envLevel = (process.env.LOG_LEVEL as LogLevel | undefined) ?? "info";
const threshold = levelOrder[envLevel] ?? levelOrder.info;

const format = (level: LogLevel, message: string, meta?: Record<string, unknown>) => {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ?? {}),
  };
  return JSON.stringify(payload);
};

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    if (threshold >= levelOrder.info) console.log(format("info", message, meta));
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    if (threshold >= levelOrder.warn) console.warn(format("warn", message, meta));
  },
  error: (message: string, meta?: Record<string, unknown>) => {
    if (threshold >= levelOrder.error) console.error(format("error", message, meta));
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (threshold >= levelOrder.debug) console.debug(format("debug", message, meta));
  },
};
