// simulate_diff.ts
const kv = await Deno.openKv("tutti-market");

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split("T")[0];

// Grab any live image URL from your #car-archives channel to test rendering
const testListing = {
  listingID: "999999999",
  title: "BMW E36 325i Coupe (Simulation Test)",
  body: "M50B25 engine, manual, clean test record to verify alert dispatch.",
  formattedPrice: "4'500.-",
  price: 4500,
  archivedImageUrl: "https://cdn.discordapp.com/attachments/1222222481285316729/1553020954903584850/image.png?ex=6aba5df9&is=6ab90c79&hm=a1d2b228f76ffa8a8ba8cdcb1440ddf5a47b3378ef2a322886d74648fd21e036&", // replace with a real Discord attachment URL from Test 2
  timestamp: Date.now() - (5 * 24 * 60 * 60 * 1000), // 5 days old (well under 60 days)
  savedAt: yesterday.toISOString(),
};

// Insert into yesterday's snapshot
await kv.set(["scrapes", yesterdayStr, "999999999"], testListing);
console.log(`Injected fake listing into ${yesterdayStr}`);

kv.close();