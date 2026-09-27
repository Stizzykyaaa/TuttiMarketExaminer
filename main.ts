
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

// 2. Run the search query
console.log("Searching listings...");
const result = await client
  .search("BMW")
  .category("cars")
  .select("carsAutoScoutBrand", "bmw")
  .interval("carsAutoScoutRegYear", { min: 2004, max: 2007 })
  .interval("carsAutoScoutMileage", { max: 200000 })
  .multiSelect("carsAutoScoutTransmissionType", ["manual"])
  .price({ max: 5000 })
  .multiSelect("language", ["de"])
  .sort("timestamp", "desc")
  .fetch();

console.log(`Found ${result.listings.length} listings to process.`);

// 3. Process each listing
for (const listing of result.listings) {
  const id = listing.listingID;
  console.log(`Processing listing ${id}: ${listing.title}`);

  // Fetch full details to get `body` and full-res image list
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

  // Download all available image renditions
  for (let i = 0; i < fullImages.length; i++) {
    const imgUrl = fullImages[i]?.rendition?.src;
    if (!imgUrl) continue;

    const filePath = `${dirPath}/${i + 1}.jpg`;
    const success = await downloadImage(imgUrl, filePath);
    if (success) {
      savedImagePaths.push(filePath);
    }
  }

  // Build the record
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

  // Save record to Deno KV
  await kv.set(["listings", id], listingRecord);
  console.log(`Saved ${id} with ${savedImagePaths.length} images to KV.\n`);
}

console.log("Done.");