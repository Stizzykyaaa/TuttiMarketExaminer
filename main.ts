// Run with: deno run --allow-net --allow-read --allow-write --unstable-kv main.ts

import { TuttiClient } from "tutti-api";

// 1. Initialize client and Deno KV database
const client = new TuttiClient();
const kv = await Deno.openKv("tutti-market");

// Helper: Convert formatted price (e.g. "4'300.-", "Gratis") to a clean number
function parsePrice(formatted: string | null | undefined): number {
  if (!formatted) return 0;
  const digitsOnly = formatted.replace(/[^\d]/g, "");
  return digitsOnly ? parseInt(digitsOnly, 10) : 0;
}

// Helper: Download an image URL directly to disk
async function downloadImage(url: string, destPath: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const buffer = await res.arrayBuffer();
    await Deno.writeFile(destPath, new Uint8Array(buffer));
    return true;
  } catch (err) {
    console.error(`Failed to download ${url}:`, err);
    return false;
  }
}

// 2. Set up the query
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

// Execute initial search result, which holds the paginate() generator
const initialResult = await query.fetch();

// 3. Iterate through every listing across all pages automatically
for await (const listing of initialResult.paginate()) {
  const id = listing.listingID;
  console.log(`Processing listing ${id}: ${listing.title}`);

  let body = "";
  let fullImages: { rendition?: { src: string } }[] = [];

  try {
    const details = await client.listings.get(id);
    body = details?.body ?? "";
    fullImages = details?.images ?? listing.images ?? [];
  } catch (err) {
    console.warn(`Could not fetch details for ${id}, using search summary:`, err);
    fullImages = listing.images ?? [];
  }

  // Create local folder for images: ./images/<listingID>/
  const dirPath = `./images/${id}`;
  await Deno.mkdir(dirPath, { recursive: true });

  const savedImagePaths: string[] = [];

  for (let i = 0; i < fullImages.length; i++) {
    const imgUrl = fullImages[i]?.rendition?.src;
    if (!imgUrl) continue;

    const filePath = `${dirPath}/${i + 1}.jpg`;
    const success = await downloadImage(imgUrl, filePath);
    if (success) {
      savedImagePaths.push(filePath);
    }
  }

  const listingRecord = {
    listingID: id,
    title: listing.title,
    body: body,
    formattedPrice: listing.formattedPrice,
    price: parsePrice(listing.formattedPrice),
    images: savedImagePaths,
    timestamp: listing.timestamp,
    savedAt: new Date().toISOString(),
  };

  await kv.set(["listings", id], listingRecord);
  console.log(`Saved ${id} with ${savedImagePaths.length} images to KV.\n`);
  totalProcessed++;
}

console.log(`Done. Processed ${totalProcessed} total listings.`);