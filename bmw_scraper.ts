// bmw_scraper.ts
import { TuttiClient } from "tutti-api";

// 1. Concrete interface for KV cache metadata (fixes line 110 lint issue)
interface ListingMeta {
  archivedImageUrl?: string | null;
}

// 2. Wrap prototype patching inside a helper so it runs safely on demand
let patched = false;
function applyTuttiPatches() {
  if (patched) return;
  const dummyQuery = new TuttiClient().search("");
  const SearchQueryProto = Object.getPrototypeOf(dummyQuery);

  SearchQueryProto.select = function (name: string, value: string) {
    this._strings.push({ key: name, value: value });
    return this;
  };

  SearchQueryProto.multiSelect = function (name: string, values: string[]) {
    this._strings.push({ key: name, value: values });
    return this;
  };

  patched = true;
}

function parsePrice(formatted: string | null | undefined): number {
  if (!formatted) return 0;
  const digitsOnly = formatted.replace(/[^\d]/g, "");
  return digitsOnly ? parseInt(digitsOnly, 10) : 0;
}

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

// Uploads the image binary in-memory directly to Discord's archive channel
async function uploadImageToDiscordArchive(
  imageUrl: string,
  listingId: string
): Promise<string | null> {
  const archiveWebhookUrl = Deno.env.get("ARCHIVE_WEBHOOK_URL");
  if (!archiveWebhookUrl) {
    console.warn("ARCHIVE_WEBHOOK_URL is not set.");
    return null;
  }

  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const blob = await res.blob();

    const form = new FormData();
    form.append("files[0]", blob, `${listingId}.jpg`);
    form.append(
      "payload_json",
      JSON.stringify({
        content: `📦 Archived photo for listing #${listingId}`,
      })
    );

    const discordRes = await fetch(`${archiveWebhookUrl}?wait=true`, {
      method: "POST",
      body: form,
    });

    if (!discordRes.ok) {
      console.warn(`Discord archive upload failed (${discordRes.statusText})`);
      return null;
    }

    const data = await discordRes.json();
    return data?.attachments?.[0]?.url ?? null;
  } catch (err) {
    console.warn(`Could not archive image for ${listingId}:`, err);
    return null;
  }
}

export async function runScraper() {
  applyTuttiPatches();
  const client = new TuttiClient();
  const kv = await Deno.openKv();

  try {
    const todayKey = getTodayDateString();

    const query = client
      .search("BMW")
      .category("cars")
      .select("carsAutoScoutBrand", "bmw")
      .multiSelect("carsAutoScoutType", ["coupe", "saloon", "estate"])
      .interval("carsAutoScoutRegYear", { min: 1990, max: 2013 })
      .interval("carsAutoScoutMileage", { max: 200000 })
      .interval("carsAutoScoutHorsepower", { min: 150 })
      .multiSelect("carsAutoScoutTransmissionType", ["manual"])
      .price({ max: 5000 })
      .sort("timestamp", "desc");

    console.log("Starting paginated search across all pages...");

    let totalProcessed = 0;
    const initialResult = await query.fetch();

    for await (const listing of initialResult.paginate()) {
      const id = listing.listingID;
      console.log(`Processing listing ${id}: ${listing.title}`);

      let body = "";
      let fullImages: { rendition?: { src: string } }[] = [];

      try {
        const details = await client.listings.get(id);
        body = typeof details?.body === "string" ? details.body : "";
        fullImages = details?.images ?? listing.images ?? [];
      } catch (err) {
        console.warn(`Could not fetch details for ${id}, using search summary:`, err);
        fullImages = listing.images ?? [];
      }

      // Explicit type parameter solves the linter warning
      let archivedImageUrl: string | null = null;
      const existing = await kv.get<ListingMeta>(["listing_meta", id]);

      if (existing.value?.archivedImageUrl) {
        archivedImageUrl = existing.value.archivedImageUrl;
      } else {
        const primaryImgUrl = fullImages[0]?.rendition?.src;
        if (primaryImgUrl) {
          archivedImageUrl = await uploadImageToDiscordArchive(primaryImgUrl, id);
          await new Promise((r) => setTimeout(r, 600));
        }
        await kv.set(["listing_meta", id], { archivedImageUrl });
      }

      const listingRecord = {
        listingID: id,
        title: listing.title,
        body: body,
        formattedPrice: listing.formattedPrice,
        price: parsePrice(listing.formattedPrice),
        archivedImageUrl: archivedImageUrl,
        timestamp: listing.timestamp,
        savedAt: new Date().toISOString(),
      };

      await kv.set(["scrapes", todayKey, id], listingRecord);
      totalProcessed++;
    }

    console.log(`Done. Processed ${totalProcessed} total listings.`);
  } finally {
    kv.close();
  }
}

