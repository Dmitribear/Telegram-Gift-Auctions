import { OpenAPIV3 } from "openapi-types";

export const openApiSpec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "Telegram Gift Auction API",
    version: "1.0.0",
    description:
      "API для аукциона с анти-снайпингом. Все суммы в базовой валюте проекта.",
  },
  servers: [{ url: "http://localhost:3000" }],
  tags: [
    { name: "Health" },
    { name: "Users" },
    { name: "Auctions" },
    { name: "Bids" },
    { name: "Admin" },
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Проверка работоспособности",
        responses: {
          "200": { description: "OK" },
        },
      },
    },
    "/api/users": {
      post: {
        tags: ["Users"],
        summary: "Создать пользователя",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUser" },
            },
          },
        },
        responses: {
          "201": {
            description: "Пользователь создан",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "409": { description: "Username уже существует" },
        },
      },
    },
    "/api/users/{userId}": {
      get: {
        tags: ["Users"],
        summary: "Получить пользователя",
        parameters: [
          {
            in: "path",
            name: "userId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Пользователь",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
          "404": { description: "Не найден" },
        },
      },
    },
    "/api/users/{userId}/deposit": {
      post: {
        tags: ["Users"],
        summary: "Пополнить баланс",
        parameters: [
          {
            in: "path",
            name: "userId",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Deposit" },
            },
          },
        },
        responses: {
          "200": {
            description: "Обновленный пользователь",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
        },
      },
    },
    "/api/auctions": {
      get: {
        tags: ["Auctions"],
        summary: "Список аукционов",
        parameters: [
          {
            in: "query",
            name: "status",
            required: false,
            schema: { $ref: "#/components/schemas/AuctionStatus" },
          },
        ],
        responses: {
          "200": {
            description: "Список",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Auction" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Auctions"],
        summary: "Создать аукцион",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateAuction" },
            },
          },
        },
        responses: {
          "201": {
            description: "Созданный аукцион",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Auction" },
              },
            },
          },
        },
      },
    },
    "/api/auctions/{auctionId}": {
      get: {
        tags: ["Auctions"],
        summary: "Получить аукцион",
        parameters: [
          {
            in: "path",
            name: "auctionId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Аукцион",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Auction" },
              },
            },
          },
          "404": { description: "Не найден" },
        },
      },
    },
    "/api/auctions/{auctionId}/bids": {
      get: {
        tags: ["Bids"],
        summary: "Список ставок по аукциону",
        parameters: [
          {
            in: "path",
            name: "auctionId",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Список ставок",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Bid" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Bids"],
        summary: "Сделать ставку",
        parameters: [
          {
            in: "path",
            name: "auctionId",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateBid" },
            },
          },
        },
        responses: {
          "201": {
            description: "Созданная ставка",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Bid" },
              },
            },
          },
        },
      },
    },
    "/api/auctions/{auctionId}/finalize": {
      post: {
        tags: ["Admin"],
        summary: "Финализировать аукцион",
        parameters: [
          {
            in: "path",
            name: "auctionId",
            required: true,
            schema: { type: "string" },
          },
          {
            in: "query",
            name: "force",
            required: false,
            schema: { type: "boolean" },
            description: "Если true — разрешает финализацию активного/запланированного аукциона вручную",
          },
        ],
        responses: {
          "200": {
            description: "Финализированный аукцион",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Auction" },
              },
            },
          },
        },
      },
    },
    "/api/bids": {
      post: {
        tags: ["Bids"],
        summary: "Сделать ставку (альтернативный маршрут)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateBidDirect" },
            },
          },
        },
        responses: {
          "201": {
            description: "Созданная ставка",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Bid" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      AuctionStatus: {
        type: "string",
        enum: ["scheduled", "active", "ended"],
      },
      User: {
        type: "object",
        properties: {
          _id: { type: "string" },
          username: { type: "string" },
          balance: { type: "number" },
          lockedBalance: { type: "number" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateUser: {
        type: "object",
        required: ["username"],
        properties: {
          username: { type: "string" },
          balance: { type: "number", minimum: 0 },
        },
      },
      Deposit: {
        type: "object",
        required: ["amount"],
        properties: {
          amount: { type: "number", minimum: 0 },
        },
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
          highestBidder: { type: "string" },
          highestBid: { type: "string" },
          bidsCount: { type: "number" },
          winnerUserId: { type: "string" },
          winnerBidId: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateAuction: {
        type: "object",
        required: ["title", "startPrice", "bidStep", "baseDurationMinutes"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          startPrice: { type: "number", minimum: 0 },
          bidStep: { type: "number", minimum: 1 },
          baseDurationMinutes: { type: "number", minimum: 1 },
          startTime: { type: "string", format: "date-time" },
          antiSnipeWindowMinutes: { type: "number", minimum: 0 },
          antiSnipeExtensionMinutes: { type: "number", minimum: 1 },
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
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      CreateBid: {
        type: "object",
        required: ["userId", "amount"],
        properties: {
          userId: { type: "string" },
          amount: { type: "number", minimum: 0 },
        },
      },
      CreateBidDirect: {
        type: "object",
        required: ["auctionId", "userId", "amount"],
        properties: {
          auctionId: { type: "string" },
          userId: { type: "string" },
          amount: { type: "number", minimum: 0 },
        },
      },
    },
  },
};
