import { OpenAPIV3 } from "openapi-types";

export const openApiSpec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "Telegram Gift Auction API",
    version: "1.1.0",
    description:
      "HTTP API for user/auth flows, auctions, bidding with anti-snipe, wallet/deposits, and admin controls.",
  },
  servers: [{ url: "http://localhost:3000" }],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Auctions" },
    { name: "Users" },
    { name: "Wallet" },
    { name: "Admin" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          details: { nullable: true },
        },
      },
      AuctionStatus: {
        type: "string",
        enum: ["scheduled", "active", "ended"],
      },
      Auction: {
        type: "object",
        properties: {
          _id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          startPrice: { type: "number" },
          bidStep: { type: "number" },
          currentPrice: { type: "number" },
          startTime: { type: "string", format: "date-time" },
          endTime: { type: "string", format: "date-time" },
          antiSnipeWindowMs: { type: "number" },
          antiSnipeExtensionMs: { type: "number" },
          status: { $ref: "#/components/schemas/AuctionStatus" },
          bidsCount: { type: "number" },
          winnerUserId: { type: "string" },
          winnerBidId: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Bid: {
        type: "object",
        properties: {
          _id: { type: "string" },
          auction: { type: "string" },
          user: { type: "string" },
          amount: { type: "number" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      User: {
        type: "object",
        properties: {
          username: { type: "string" },
          balance: { type: "number" },
          lockedBalance: { type: "number" },
          heldBalance: { type: "number" },
          prizeBalance: { type: "number" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Wallet: {
        type: "object",
        properties: {
          user: { type: "string" },
          address: { type: "string" },
          balanceTon: { type: "number" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          token: { type: "string" },
          role: { type: "string", enum: ["user", "admin"] },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Service readiness probe",
        responses: { "200": { description: "OK" } },
      },
    },
    "/metrics": {
      get: {
        tags: ["Health"],
        summary: "Prometheus metrics",
        responses: { "200": { description: "Prometheus metrics text" } },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "User login (issues JWT)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username"],
                properties: { username: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "JWT issued",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } },
            },
          },
          "400": { description: "Missing username", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/admin/login": {
      post: {
        tags: ["Admin"],
        summary: "Admin login with shared secret",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["password"],
                properties: { username: { type: "string" }, password: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Admin JWT issued",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } },
            },
          },
          "401": { description: "Invalid secret", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/auctions": {
      get: {
        tags: ["Auctions"],
        summary: "List auctions",
        responses: {
          "200": {
            description: "Auctions",
            content: {
              "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Auction" } } },
            },
          },
        },
      },
      post: {
        tags: ["Auctions"],
        summary: "Create auction (admin)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "startPrice", "bidStep", "baseDurationMinutes"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  startPrice: { type: "number" },
                  bidStep: { type: "number" },
                  baseDurationMinutes: { type: "number" },
                  startTime: { type: "string", format: "date-time" },
                  antiSnipeWindowMinutes: { type: "number" },
                  antiSnipeExtensionMinutes: { type: "number" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Auction" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/auctions/{auctionId}": {
      get: {
        tags: ["Auctions"],
        summary: "Auction with bids",
        parameters: [
          { name: "auctionId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "Auction detail",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    auction: { $ref: "#/components/schemas/Auction" },
                    bids: { type: "array", items: { $ref: "#/components/schemas/Bid" } },
                  },
                },
              },
            },
          },
          "404": { description: "Not found", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/auctions/{auctionId}/bids": {
      post: {
        tags: ["Auctions"],
        summary: "Place bid (auth)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "auctionId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["amount"],
                properties: { amount: { type: "number" } },
              },
            },
          },
        },
        responses: {
          "201": { description: "Bid placed", content: { "application/json": { schema: { $ref: "#/components/schemas/Bid" } } } },
          "400": { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/auctions/{auctionId}/finalize": {
      post: {
        tags: ["Admin"],
        summary: "Finalize auction (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "auctionId", in: "path", required: true, schema: { type: "string" } },
          { name: "force", in: "query", required: false, schema: { type: "boolean" } },
        ],
        responses: {
          "200": { description: "Finalized", content: { "application/json": { schema: { $ref: "#/components/schemas/Auction" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/users/deposit": {
      post: {
        tags: ["Users"],
        summary: "Deposit to internal balance",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["amount"],
                properties: { amount: { type: "number" }, username: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated user", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/wallet": {
      get: {
        tags: ["Wallet"],
        summary: "Get wallet by token user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Wallet", content: { "application/json": { schema: { $ref: "#/components/schemas/Wallet" } } } },
        },
      },
    },
    "/wallet/bridge-to-site": {
      post: {
        tags: ["Wallet"],
        summary: "Move TON to site balance",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["amount"], properties: { amount: { type: "number" } } } } },
        },
        responses: { "200": { description: "Wallet" } },
      },
    },
    "/wallet/bridge-from-site": {
      post: {
        tags: ["Wallet"],
        summary: "Withdraw from site to TON wallet",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["amount"], properties: { amount: { type: "number" } } } } },
        },
        responses: { "200": { description: "Wallet" } },
      },
    },
  },
};
