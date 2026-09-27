// analyzer.ts
export interface ListingRecord {
  listingID: string;
  title: string;
  body: string;
  formattedPrice: string;
  price: number;
  archivedImageUrl?: string | null;
  timestamp: string | number;
  savedAt: string;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

async function sendDisappearedAlert(listing: ListingRecord) {
  const descriptionText = listing.body
    ? listing.body.length > 300
      ? listing.body.slice(0, 297) + "..."
      : listing.body
    : "No description provided.";

  const payload = {
    embeds: [
      {
        title: `🚗 Listing Disappeared: ${listing.title}`,
        url: `https://www.tutti.ch/vi/${listing.listingID}`,
        color: 0xe74c3c, // Red
        fields: [
          {
            name: "💰 Price",
            value: listing.formattedPrice || `${listing.price} CHF`,
            inline: true,
          },
          {
            name: "🆔 ID",
            value: listing.listingID,
            inline: true,
          },
          {
            name: "📝 Description",
            value: descriptionText,
            inline: false,
          },
        ],
        // Uses the Discord-hosted URL that survives Tutti's deletion
        image: listing.archivedImageUrl ? { url: listing.archivedImageUrl } : undefined,
        footer: {
          text: `Original Post: ${listing.timestamp} | Missing as of: ${new Date().toLocaleDateString()}`,
        },
      },
    ],
  };

  try {
    const res = await fetch(ALERTS_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`Failed to post alert for ${listing.listingID}: ${res.statusText}`);
    } else {
      console.log(`Alert sent to Discord for ${listing.listingID}`);
    }
  } catch (err) {
    console.error(`Error sending alert:`, err);
  }
}

export async function cleanAndDetectDisappearedListings(): Promise<void> {
  const kv = await Deno.openKv();

  try {
    const now = new Date();
    const todayStr = formatDate(now);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    console.log(`Analyzing diff between ${yesterdayStr} and ${todayStr}...`);

    // --- PART A: Garbage Collector ---
    console.log("Running garbage collection on older scrape snapshots...");
    const allScrapes = kv.list({ prefix: ["scrapes"] });

    for await (const entry of allScrapes) {
      const entryDate = entry.key[1] as string;
      if (entryDate !== todayStr && entryDate !== yesterdayStr) {
        await kv.delete(entry.key);
      }
    }
    console.log("Garbage collection complete.");

    // --- PART B: Diff & 60-Day Filter ---
    const yesterdayMap = new Map<string, ListingRecord>();
    const yesterdayEntries = kv.list<ListingRecord>({ prefix: ["scrapes", yesterdayStr] });
    for await (const entry of yesterdayEntries) {
      const listingId = entry.key[2] as string;
      yesterdayMap.set(listingId, entry.value);
    }

    const todayIds = new Set<string>();
    const todayEntries = kv.list<ListingRecord>({ prefix: ["scrapes", todayStr] });
    for await (const entry of todayEntries) {
      const listingId = entry.key[2] as string;
      todayIds.add(listingId);
    }

    const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;
    let alertCount = 0;

    for (const [id, listing] of yesterdayMap.entries()) {
      if (!todayIds.has(id)) {
        const listingTime =
          typeof listing.timestamp === "number"
            ? listing.timestamp > 1e11
              ? listing.timestamp
              : listing.timestamp * 1000
            : new Date(listing.timestamp).getTime();

        const ageMs = now.getTime() - listingTime;

        if (ageMs <= SIXTY_DAYS_MS) {
          await sendDisappearedAlert(listing);
          alertCount++;
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    }

    console.log(`Finished processing. Dispatched ${alertCount} alerts.`);
  } finally {
    kv.close();
  }
}

if (import.meta.main) {
  await cleanAndDetectDisappearedListings();
}