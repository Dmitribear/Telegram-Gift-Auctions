/* Sniper bot: waits random delay, then bids slightly higher. */

const BASE = process.env.API_BASE ?? "http://localhost:3000";
const USER = process.env.SNIPER_USER ?? "sniper-bot";

async function listAuctions() {
  const res = await fetch(`${BASE}/auctions`);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as any[];
}

async function bid(auctionId: string, amount: number) {
  const res = await fetch(`${BASE}/auctions/${auctionId}/bids`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, user: USER }),
  });
  if (!res.ok) {
    console.error("[sniper] bid fail", res.status, await res.text());
  }
}

async function main() {
  while (true) {
    const auctions = await listAuctions();
    if (!auctions.length) {
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }
    const a = auctions[Math.floor(Math.random() * auctions.length)];
    const min = (a.startingPrice ?? 0) + (a.minBidStep ?? 1);
    const amount = min + Math.random() * a.minBidStep * 2;
    // emulate snipe: wait close to end window (3-7s)
    const wait = 3000 + Math.random() * 4000;
    await new Promise((r) => setTimeout(r, wait));
    await bid(a._id, amount);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
