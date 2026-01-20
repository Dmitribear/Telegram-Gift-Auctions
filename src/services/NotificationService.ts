import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { notificationsSentCounter } from "../config/metrics";
import { AuctionDocument } from "../models/Auction.model";
import { BidDocument } from "../models/Bid";
import { logger } from "../utils/logger";

type NotificationEvent =
  | { type: "bid.placed"; auctionId: string; amount: number; user: string }
  | { type: "auction.finalized"; auctionId: string; winner?: string; amount?: number }
  | { type: "auction.extended"; auctionId: string; newEndTime: string; by: string };

class NotificationService {
  private webhookUrl?: string;
  private telegramToken?: string;
  private telegramChatId?: string;
  private wss?: WebSocketServer;

  constructor() {
    this.webhookUrl = process.env.NOTIFY_WEBHOOK_URL;
    this.telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    this.telegramChatId = process.env.TELEGRAM_CHAT_ID;
  }

  attachWebSocket(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.wss.on("connection", (socket: WebSocket) => {
      socket.send(JSON.stringify({ type: "welcome", ts: new Date().toISOString() }));
    });
  }

  private async sendWebhook(event: NotificationEvent) {
    if (!this.webhookUrl) return;
    try {
      await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      notificationsSentCounter.labels("webhook").inc();
    } catch (err) {
      logger.warn("Webhook notification failed", {
        error: (err as Error).message,
      });
    }
  }

  private async sendTelegram(text: string) {
    if (!this.telegramToken || !this.telegramChatId) return;
    const url = `https://api.telegram.org/bot${this.telegramToken}/sendMessage`;
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: this.telegramChatId, text }),
      });
      notificationsSentCounter.labels("telegram").inc();
    } catch (err) {
      logger.warn("Telegram notification failed", {
        error: (err as Error).message,
      });
    }
  }

  private broadcast(event: NotificationEvent) {
    if (!this.wss) return;
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(event));
      }
    }
    notificationsSentCounter.labels("websocket").inc();
  }

  private async emit(event: NotificationEvent) {
    this.broadcast(event);
    await Promise.all([
      this.sendWebhook(event),
      this.sendTelegram(this.formatText(event)),
    ]);
  }

  private formatText(event: NotificationEvent): string {
    if (event.type === "bid.placed") {
      return `Bid: ${event.amount} TON by ${event.user} for auction ${event.auctionId}`;
    }
    if (event.type === "auction.extended") {
      return `Auction ${event.auctionId} extended until ${event.newEndTime} by ${event.by}`;
    }
    return `Auction ${event.auctionId} finalized${event.winner ? `, winner ${event.winner}` : ""}${
      event.amount ? ` for ${event.amount} TON` : ""
    }`;
  }

  async notifyBidPlaced(auctionId: string, bid: BidDocument, username: string) {
    await this.emit({
      type: "bid.placed",
      auctionId,
      amount: bid.amount,
      user: username,
    });
  }

  async notifyAuctionExtended(auctionId: string, newEndTime: Date, by: string) {
    await this.emit({
      type: "auction.extended",
      auctionId,
      newEndTime: newEndTime.toISOString(),
      by,
    });
  }

  async notifyAuctionFinalized(auction: AuctionDocument, winner?: string, amount?: number) {
    await this.emit({
      type: "auction.finalized",
      auctionId: auction._id.toString(),
      winner,
      amount,
    });
  }
}

export const notificationService = new NotificationService();
