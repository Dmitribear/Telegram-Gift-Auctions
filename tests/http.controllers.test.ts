import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { balanceService } from "../src/services/BalanceService";

describe("HTTP controllers", () => {
  it("allows deposit + bid + finalize flow", async () => {
    const loginRes = await request(app).post("/auth/login").send({ username: "alice" });
    expect(loginRes.status).toBe(200);
    const userToken = loginRes.body.token as string;

    await request(app)
      .post("/users/link")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ type: "card", masked: "**** 4242" })
      .expect(200);

    await request(app)
      .post("/users/deposit")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ amount: 100 })
      .expect(200);

    const adminRes = await request(app).post("/admin/login").send({ password: "admin-secret" });
    expect(adminRes.status).toBe(200);
    const adminToken = adminRes.body.token as string;

    const createRes = await request(app)
      .post("/auctions")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Test lot",
        startPrice: 10,
        bidStep: 5,
        baseDurationMinutes: 0.001,
        antiSnipeWindowMinutes: 0.5,
        antiSnipeExtensionMinutes: 0.5,
      });
    expect(createRes.status).toBe(201);
    const auctionId = createRes.body._id as string;

    const bidRes = await request(app)
      .post(`/auctions/${auctionId}/bids`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ amount: 15 });
    expect(bidRes.status).toBe(201);

    await request(app)
      .post(`/auctions/${auctionId}/finalize?force=true`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const txRes = await request(app)
      .get("/transactions")
      .set("Authorization", `Bearer ${userToken}`);
    expect(txRes.status).toBe(200);
    expect(Array.isArray(txRes.body)).toBe(true);
    expect(txRes.body.length).toBeGreaterThan(0);

    const user = await balanceService.get("alice");
    expect(user?.lockedBalance).toBe(0);
    expect(user?.prizeBalance).toBeGreaterThanOrEqual(15);
  });
});
