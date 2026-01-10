/* Simple CLI bot runner.
   Run: ts-node scripts/bots/bid-bot.ts
*/

const BASE = process.env.API_BASE ?? "http://localhost:3000";
const BOTS = Number(process.env.BOTS ?? 3);

async function bid(auctionId: string, amount: number, user: string) {
  const res = await fetch(`${BASE}/auctions/${auctionId}/bids`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, user }),
  });
  if (!res.ok) {
    console.error(`[${user}] bid fail`, res.status, await res.text());
  }
}

async function listAuctions() {
  const res = await fetch(`${BASE}/auctions`);
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as any[];
}

async function runBot(id: number) {
  const user = `cli-bot-${id}`;
  while (true) {
    const auctions = await listAuctions();
    if (!auctions.length) {
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }
    const a = auctions[Math.floor(Math.random() * auctions.length)];
    const min = (a.startingPrice ?? 0) + (a.minBidStep ?? 1);
    const amount = min + Math.random() * a.minBidStep;
    await bid(a._id, amount, user);
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1500));
  }
}

async function main() {
  await Promise.all(Array.from({ length: BOTS }).map((_, i) => runBot(i + 1)));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
