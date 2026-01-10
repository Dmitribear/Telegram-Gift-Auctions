/* Simple load script using native fetch (Node 18+).
   Creates N auctions and spams bids concurrently.
   Run: ts-node scripts/load/run-load-test.ts
*/

const BASE = process.env.API_BASE ?? "http://localhost:3000";

type Auction = {
  _id: string;
  title: string;
  minBidStep: number;
  startingPrice: number;
};

async function createAuction(i: number): Promise<Auction> {
  const res = await fetch(`${BASE}/auctions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: `Load Test #${i}`,
      description: "load",
      startingPrice: 10,
      minBidStep: 1,
      roundDurationSeconds: 60,
      maxParticipantsPerRound: 100,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as Auction;
}

async function bid(auctionId: string, amount: number, user = "load-bot") {
  const res = await fetch(`${BASE}/auctions/${auctionId}/bids`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, user }),
  });
  if (!res.ok) {
    console.error("bid fail", res.status, await res.text());
  }
}

async function main() {
  const auctions: Auction[] = [];
  for (let i = 0; i < 3; i++) {
    auctions.push(await createAuction(i + 1));
  }

  console.log("created", auctions.length, "auctions");

  const workers = Array.from({ length: 10 }).map(async (_, idx) => {
    while (true) {
      const a = auctions[Math.floor(Math.random() * auctions.length)];
      const base = a.startingPrice + a.minBidStep;
      const amount = base + Math.random() * 5;
      await bid(a._id, amount, `load-bot-${idx}`);
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
    }
  });

  await Promise.all(workers);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
