import promClient from "prom-client";

promClient.collectDefaultMetrics();

export const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_ms",
  help: "HTTP request duration in milliseconds",
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000],
  labelNames: ["method", "route", "status"] as const,
});

export const bidsPlacedCounter = new promClient.Counter({
  name: "auction_bids_total",
  help: "Total number of bids placed",
});

export const auctionsFinalizedCounter = new promClient.Counter({
  name: "auction_finalized_total",
  help: "Total number of auctions finalized",
});

export const notificationsSentCounter = new promClient.Counter({
  name: "notifications_sent_total",
  help: "Number of notification attempts",
  labelNames: ["channel"] as const,
});

export const activeAuctionsGauge = new promClient.Gauge({
  name: "auction_active_count",
  help: "Number of active auctions",
});

export const metricsRegistry = promClient.register;
